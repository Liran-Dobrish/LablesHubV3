// Shared model and view-state types — see data-model.md.

export interface LabelCreator {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TfvcLabel {
  id: string;
  name: string;
  description: string | null;
  createdDate: string;
  creator: LabelCreator;
  /** Root TFVC path the label applies to; seeds the folder tree root. */
  scopePath: string;
}

export interface LabelFolderNode {
  path: string;
  name: string;
  parentPath: string | null;
  hasChildren: boolean;
}

export type LabelItemType = 'file' | 'folder';

export interface LabelItem {
  path: string;
  name: string;
  type: LabelItemType;
}

export interface LabelListFilterState {
  searchText: string;
  creatorId: string | null;
}

export interface LabelDetailsState {
  label: TfvcLabel;
  selectedFolderPath: string;
}

export type DataAccessErrorKind = 'network' | 'unauthorized' | 'not-found' | 'unknown';

export interface DataAccessError {
  kind: DataAccessErrorKind;
  message: string;
}
