// Unit test for label list filtering (name/description + creator + combined) — US1.
import { filterLabels, getDistinctCreators } from '../../src/hubs/label-list/filterLabels';
import type { TfvcLabel } from '../../src/models/types';

function makeLabel(overrides: Partial<TfvcLabel>): TfvcLabel {
  return {
    id: 'label-1',
    name: 'Release-1.0',
    description: 'First stable release',
    createdDate: '2026-01-01T00:00:00Z',
    creator: { id: 'user-1', displayName: 'Alice', avatarUrl: null },
    scopePath: '$/Proj',
    ...overrides,
  };
}

describe('filterLabels', () => {
  const labels: TfvcLabel[] = [
    makeLabel({ id: '1', name: 'Release-1.0', description: 'First stable release', creator: { id: 'u1', displayName: 'Alice', avatarUrl: null } }),
    makeLabel({ id: '2', name: 'Release-2.0', description: 'Second release', creator: { id: 'u2', displayName: 'Bob', avatarUrl: null } }),
    makeLabel({ id: '3', name: 'Hotfix', description: 'Urgent patch by Alice', creator: { id: 'u2', displayName: 'Bob', avatarUrl: null } }),
  ];

  it('returns all labels when no filters are set', () => {
    expect(filterLabels(labels, { searchText: '', creatorId: null })).toHaveLength(3);
  });

  it('matches free text against the label name', () => {
    const result = filterLabels(labels, { searchText: 'release-1', creatorId: null });
    expect(result.map((l) => l.id)).toEqual(['1']);
  });

  it('matches free text against the description', () => {
    const result = filterLabels(labels, { searchText: 'alice', creatorId: null });
    expect(result.map((l) => l.id).sort()).toEqual(['3']);
  });

  it('filters by creator id', () => {
    const result = filterLabels(labels, { searchText: '', creatorId: 'u2' });
    expect(result.map((l) => l.id).sort()).toEqual(['2', '3']);
  });

  it('applies free text and creator filters together', () => {
    const result = filterLabels(labels, { searchText: 'release', creatorId: 'u2' });
    expect(result.map((l) => l.id)).toEqual(['2']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterLabels(labels, { searchText: 'no-such-label', creatorId: null })).toHaveLength(0);
  });
});

describe('getDistinctCreators', () => {
  it('returns distinct creators sorted by display name', () => {
    const labels: TfvcLabel[] = [
      makeLabel({ id: '1', creator: { id: 'u2', displayName: 'Bob', avatarUrl: null } }),
      makeLabel({ id: '2', creator: { id: 'u1', displayName: 'Alice', avatarUrl: null } }),
      makeLabel({ id: '3', creator: { id: 'u2', displayName: 'Bob', avatarUrl: null } }),
    ];

    const creators = getDistinctCreators(labels);
    expect(creators.map((c) => c.displayName)).toEqual(['Alice', 'Bob']);
  });
});
