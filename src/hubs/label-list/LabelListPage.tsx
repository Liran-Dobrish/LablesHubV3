// Main hub page: fetch labels, apply filters, render the two-line list — US1 (FR-001..FR-006, FR-013, FR-014).
import * as React from 'react';
import { Page } from 'azure-devops-ui/Page';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { tfvcLabelsClient } from '../../services/tfvcLabelsClient';
import type { DataAccessError, LabelListFilterState, TfvcLabel } from '../../models/types';
import { filterLabels, getDistinctCreators } from './filterLabels';
import { LabelListFilterBar } from '../../components/LabelListFilterBar';
import { LabelRow } from '../../components/LabelRow';
import { StateMessage } from '../../components/StateMessage';
import { strings } from '../../common/strings';

export interface LabelListPageProps {
  onOpenLabel: (labelId: string, filterState: LabelListFilterState) => void;
  initialFilterState?: LabelListFilterState;
}

type LoadState = 'loading' | 'loaded' | 'error';

export const LabelListPage: React.FC<LabelListPageProps> = ({ onOpenLabel, initialFilterState }) => {
  const [labels, setLabels] = React.useState<TfvcLabel[]>([]);
  const [loadState, setLoadState] = React.useState<LoadState>('loading');
  const [error, setError] = React.useState<DataAccessError | null>(null);
  const [filterState, setFilterState] = React.useState<LabelListFilterState>(
    initialFilterState ?? { searchText: '', creatorId: null }
  );

  const loadLabels = React.useCallback(() => {
    setLoadState('loading');
    setError(null);
    tfvcLabelsClient
      .getLabels()
      .then((result) => {
        setLabels(result);
        setLoadState('loaded');
      })
      .catch((err: DataAccessError) => {
        setError(err);
        setLoadState('error');
      });
  }, []);

  React.useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const creators = React.useMemo(() => getDistinctCreators(labels), [labels]);
  const visibleLabels = React.useMemo(() => filterLabels(labels, filterState), [labels, filterState]);

  const handleFilterChanged = React.useCallback((searchText: string, creatorId: string | null) => {
    setFilterState({ searchText, creatorId });
  }, []);

  return (
    <Page className="tfvc-label-list-page flex-grow">
      <Header title={strings.labelListPageTitle} titleSize={TitleSize.Large} />
      <LabelListFilterBar creators={creators} onFilterChanged={handleFilterChanged} />

      {loadState === 'loading' && <Spinner size={SpinnerSize.large} label={strings.labelListLoading} />}

      {loadState === 'error' && (
        <StateMessage
          kind="error"
          primaryText={strings.labelListLoadErrorTitle}
          secondaryText={error?.message}
          onRetry={loadLabels}
        />
      )}

      {loadState === 'loaded' && visibleLabels.length === 0 && (
        <StateMessage
          kind="empty"
          primaryText={labels.length === 0 ? strings.labelListEmptyNoLabels : strings.labelListEmptyNoMatches}
        />
      )}

      {loadState === 'loaded' && visibleLabels.length > 0 && (
        <div className="tfvc-label-list" role="table" aria-label="TFVC labels">
          {visibleLabels.map((label) => (
            <div
              key={label.id}
              role="row"
              tabIndex={0}
              className="tfvc-label-list-row bolt-list-row"
              onClick={() => onOpenLabel(label.id, filterState)}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  onOpenLabel(label.id, filterState);
                }
              }}
            >
              <LabelRow label={label} />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
};
