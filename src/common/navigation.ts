// Pure URL build/parse helpers for the single-hub list/details view switch, with preserved filter state — FR-006/FR-008.
import type { LabelListFilterState } from '../models/types';

export interface LabelDetailsQuery {
  labelId: string;
  filterState: LabelListFilterState;
}

export function buildLabelDetailsUrl(labelId: string, filterState: LabelListFilterState): string {
  const query = new URLSearchParams({
    labelId,
    searchText: filterState.searchText,
    creatorId: filterState.creatorId ?? '',
  });
  return `?${query.toString()}`;
}

export function parseLabelDetailsQuery(search: string): LabelDetailsQuery | null {
  const params = new URLSearchParams(search);
  const labelId = params.get('labelId');
  if (!labelId) {
    return null;
  }
  return {
    labelId,
    filterState: {
      searchText: params.get('searchText') ?? '',
      creatorId: params.get('creatorId') || null,
    },
  };
}

export function buildLabelListUrl(filterState: LabelListFilterState): string {
  const query = new URLSearchParams({
    searchText: filterState.searchText,
    creatorId: filterState.creatorId ?? '',
  });
  return `?${query.toString()}`;
}

export function parseLabelListQuery(search: string): LabelListFilterState {
  const params = new URLSearchParams(search);
  return {
    searchText: params.get('searchText') ?? '',
    creatorId: params.get('creatorId') || null,
  };
}
