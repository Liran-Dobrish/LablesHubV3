// Pure filtering/derivation logic for the main label list — kept separate from LabelListPage for easy unit testing.
import type { LabelCreator, LabelListFilterState, TfvcLabel } from '../../models/types';

export function filterLabels(labels: TfvcLabel[], filter: LabelListFilterState): TfvcLabel[] {
  const searchText = filter.searchText.trim().toLowerCase();
  return labels.filter((label) => {
    const matchesText =
      searchText.length === 0 ||
      label.name.toLowerCase().includes(searchText) ||
      (label.description ?? '').toLowerCase().includes(searchText);
    const matchesCreator = !filter.creatorId || label.creator.id === filter.creatorId;
    return matchesText && matchesCreator;
  });
}

export function getDistinctCreators(labels: TfvcLabel[]): LabelCreator[] {
  const byId = new Map<string, LabelCreator>();
  for (const label of labels) {
    if (!byId.has(label.creator.id)) {
      byId.set(label.creator.id, label.creator);
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
