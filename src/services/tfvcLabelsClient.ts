// Implements the TfvcLabelsClient contract — see contracts/tfvc-labels-client.md and research.md §3.
import { TfvcRestClient, type TfvcItem, type TfvcLabelRequestData } from 'azure-devops-extension-api/Tfvc';
import * as SDK from 'azure-devops-extension-sdk';
import * as API from 'azure-devops-extension-api';
import type { DataAccessError, LabelItem, TfvcLabel } from '../models/types';
import { leafSegment, parentPath } from '../common/formatting';

export interface TfvcLabelsClient {
  getLabels(): Promise<TfvcLabel[]>;
  getLabel(labelId: string): Promise<TfvcLabel>;
  getLabelFolderContents(labelId: string, folderPath: string): Promise<LabelItem[]>;
}

interface TfvcLabelRefLike {
  id?: number | string;
  name?: string;
  description?: string;
  owner?: { id?: string; displayName?: string; imageUrl?: string };
  modifiedDate?: Date | string;
}

function toDataAccessError(error: unknown): DataAccessError {
  const status = (error as { status?: number } | undefined)?.status;
  if (status === 401 || status === 403) {
    return { kind: 'unauthorized', message: 'You do not have permission to access this data.' };
  }
  if (status === 404) {
    return { kind: 'not-found', message: 'The requested label could not be found.' };
  }
  if (error instanceof TypeError) {
    return { kind: 'network', message: 'A network error occurred while loading data.' };
  }
  return {
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'An unknown error occurred.',
  };
}

function mapLabel(ref: TfvcLabelRefLike, scopePath: string): TfvcLabel {
  return {
    id: String(ref.id ?? ''),
    name: ref.name ?? '',
    description: ref.description && ref.description.length > 0 ? ref.description : null,
    createdDate: ref.modifiedDate ? new Date(ref.modifiedDate).toISOString() : '',
    creator: {
      id: ref.owner?.id ?? '',
      displayName: ref.owner?.displayName ?? 'Unknown',
      avatarUrl: ref.owner?.imageUrl ?? null,
    },
    scopePath,
  };
}

function mapItem(item: TfvcItem): LabelItem {
  const path = item.path ?? '';
  return {
    path,
    name: leafSegment(path),
    type: item.isFolder ? 'folder' : 'file',
    changeset: item.version ?? 0,
    checkedInDate: item.changeDate ? new Date(item.changeDate).toISOString() : '',
  };
}

export class RestTfvcLabelsClient implements TfvcLabelsClient {
  private readonly client = API.getClient(TfvcRestClient);
  private readonly itemsCache = new Map<string, LabelItem[]>();

  private getScopePath(): string {
    const project = SDK.getWebContext().project?.name ?? '';
    return `$/${project}`;
  }

  private getRequestData(): TfvcLabelRequestData {
    const project = SDK.getWebContext().project?.name ?? '';
    return {
      labelScope: project,
      name: '*',
      owner: '',
      itemLabelFilter: '',
      maxItemCount: 0,
      includeLinks: false,
    };
  }

  async getLabels(): Promise<TfvcLabel[]> {
    try {
      const project = SDK.getWebContext().project?.name;
      const labels = await this.client.getLabels(this.getRequestData(), project);
      const scopePath = this.getScopePath();
      return (labels ?? []).map((label) => mapLabel(label, scopePath));
    } catch (error) {
      throw toDataAccessError(error);
    }
  }

  async getLabel(labelId: string): Promise<TfvcLabel> {
    try {
      const project = SDK.getWebContext().project?.name;
      const label = await this.client.getLabel(labelId, this.getRequestData(), project);
      if (!label) {
        throw { status: 404 };
      }
      return mapLabel(label, this.getScopePath());
    } catch (error) {
      throw toDataAccessError(error);
    }
  }

  async getLabelFolderContents(labelId: string, folderPath: string): Promise<LabelItem[]> {
    try {
      const allItems = await this.getAllItems(labelId);
      return allItems.filter((item) => parentPath(item.path) === folderPath);
    } catch (error) {
      throw toDataAccessError(error);
    }
  }

  private async getAllItems(labelId: string): Promise<LabelItem[]> {
    const cached = this.itemsCache.get(labelId);
    if (cached) {
      return cached;
    }
    const items = await this.client.getLabelItems(labelId);
    const mapped = (items ?? []).map(mapItem);
    this.itemsCache.set(labelId, mapped);
    return mapped;
  }
}

export const tfvcLabelsClient: TfvcLabelsClient = new RestTfvcLabelsClient();
