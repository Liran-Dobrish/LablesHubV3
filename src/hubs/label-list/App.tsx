// Single-hub app shell: switches between the label list and label details views client-side
// (label-list is the extension's only registered hub — see vss-extension.json).
import * as React from 'react';
import { LabelListPage } from './LabelListPage';
import { LabelDetailsPage } from '../label-details/LabelDetailsPage';
import { buildLabelDetailsUrl, parseLabelDetailsQuery, parseLabelListQuery } from '../../common/navigation';
import type { LabelListFilterState } from '../../models/types';

type ViewState =
  | { view: 'list'; filterState: LabelListFilterState }
  | { view: 'details'; labelId: string; filterState: LabelListFilterState };

function readViewStateFromLocation(): ViewState {
  const detailsQuery = parseLabelDetailsQuery(window.location.search);
  if (detailsQuery) {
    return { view: 'details', labelId: detailsQuery.labelId, filterState: detailsQuery.filterState };
  }
  return { view: 'list', filterState: parseLabelListQuery(window.location.search) };
}

export const App: React.FC = () => {
  const [viewState, setViewState] = React.useState<ViewState>(() => readViewStateFromLocation());

  React.useEffect(() => {
    const handlePopState = () => setViewState(readViewStateFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openLabel = React.useCallback((labelId: string, filterState: LabelListFilterState) => {
    window.history.pushState(null, '', buildLabelDetailsUrl(labelId, filterState));
    setViewState({ view: 'details', labelId, filterState });
  }, []);

  const goBack = React.useCallback(() => {
    window.history.back();
  }, []);

  if (viewState.view === 'details') {
    return <LabelDetailsPage labelId={viewState.labelId} onBack={goBack} />;
  }

  return <LabelListPage initialFilterState={viewState.filterState} onOpenLabel={openLabel} />;
};
