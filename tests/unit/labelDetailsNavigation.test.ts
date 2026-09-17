// Unit test for label details navigation: header data + back-button filter-state round-trip — US2 (FR-007/FR-008).
// Both helpers build a same-page query string now (single hub, client-side view switch — see App.tsx).
import {
  buildLabelDetailsUrl,
  buildLabelListUrl,
  parseLabelDetailsQuery,
  parseLabelListQuery,
} from '../../src/common/navigation';
import type { LabelListFilterState } from '../../src/models/types';

describe('navigation between the list and details views', () => {
  it('round-trips a labelId and filter state through buildLabelDetailsUrl/parseLabelDetailsQuery', () => {
    const filterState: LabelListFilterState = { searchText: 'release', creatorId: 'user-42' };
    const url = buildLabelDetailsUrl('label-1', filterState);
    const query = parseLabelDetailsQuery(url.split('?')[1]);

    expect(query).toEqual({ labelId: 'label-1', filterState });
  });

  it('parseLabelDetailsQuery returns null when labelId is missing', () => {
    expect(parseLabelDetailsQuery('searchText=foo')).toBeNull();
  });

  it('treats an absent creatorId as null, not an empty string', () => {
    const query = parseLabelDetailsQuery('labelId=label-1&searchText=&creatorId=');
    expect(query?.filterState.creatorId).toBeNull();
  });

  it('round-trips filter state back to the label list via buildLabelListUrl/parseLabelListQuery', () => {
    const filterState: LabelListFilterState = { searchText: 'hotfix', creatorId: null };
    const url = buildLabelListUrl(filterState);
    const restored = parseLabelListQuery(url.split('?')[1]);

    expect(restored).toEqual(filterState);
  });

  it('builds same-page query strings (single hub, no cross-page paths)', () => {
    expect(buildLabelDetailsUrl('label-1', { searchText: '', creatorId: null })).toMatch(/^\?/);
    expect(buildLabelListUrl({ searchText: '', creatorId: null })).toMatch(/^\?/);
  });
});
