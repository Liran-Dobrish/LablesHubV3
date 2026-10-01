// Unit test for folder tree selection/content synchronization — US3 (FR-012, edge case: empty folder).
import { applyLoadedItems, selectFolder } from '../../src/hubs/label-details/folderContentsState';
import type { LabelItem } from '../../src/models/types';

const fileA: LabelItem = {
  path: '$/Proj/Folder/A.txt',
  name: 'A.txt',
  type: 'file',
  changeset: 10,
  checkedInDate: '2026-01-01T00:00:00.000Z',
};
const fileB: LabelItem = {
  path: '$/Proj/Other/B.txt',
  name: 'B.txt',
  type: 'file',
  changeset: 11,
  checkedInDate: '2026-01-02T00:00:00.000Z',
};

describe('folder contents selection state', () => {
  it('selecting a node clears previous items while the new fetch is pending', () => {
    const state = selectFolder('$/Proj/Folder');
    expect(state).toEqual({ selectedPath: '$/Proj/Folder', items: null });
  });

  it('applies a completed fetch that matches the currently selected path', () => {
    const state = selectFolder('$/Proj/Folder');
    const next = applyLoadedItems(state, '$/Proj/Folder', [fileA]);
    expect(next.items).toEqual([fileA]);
  });

  it('replaces prior content rather than merging when a new node is selected', () => {
    let state = selectFolder('$/Proj/Folder');
    state = applyLoadedItems(state, '$/Proj/Folder', [fileA]);

    state = selectFolder('$/Proj/Other');
    state = applyLoadedItems(state, '$/Proj/Other', [fileB]);

    expect(state.items).toEqual([fileB]);
  });

  it('ignores a stale response for a path that is no longer selected', () => {
    let state = selectFolder('$/Proj/Folder');
    state = selectFolder('$/Proj/Other'); // user re-selects before the first fetch resolves

    const afterStaleResponse = applyLoadedItems(state, '$/Proj/Folder', [fileA]);
    expect(afterStaleResponse).toBe(state);
    expect(afterStaleResponse.items).toBeNull();
  });

  it('supports an empty-children result for a childless folder', () => {
    const state = selectFolder('$/Proj/Empty');
    const next = applyLoadedItems(state, '$/Proj/Empty', []);
    expect(next.items).toEqual([]);
  });
});
