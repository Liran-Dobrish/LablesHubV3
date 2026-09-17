// Pure state helper for folder-content selection sync (replace, not merge) — FR-012, US3 acceptance scenario 3.
import type { LabelItem } from '../../models/types';

export interface FolderContentsState {
  selectedPath: string;
  /** null while the items for `selectedPath` are still loading. */
  items: LabelItem[] | null;
}

export function selectFolder(selectedPath: string): FolderContentsState {
  return { selectedPath, items: null };
}

/**
 * Applies a completed fetch to the state. Responses for a path that is no longer
 * selected (e.g. the user picked another node before the fetch resolved) are ignored,
 * so the right-hand panel always reflects only the most recently selected node.
 */
export function applyLoadedItems(
  state: FolderContentsState,
  forPath: string,
  items: LabelItem[]
): FolderContentsState {
  if (forPath !== state.selectedPath) {
    return state;
  }
  return { selectedPath: state.selectedPath, items };
}
