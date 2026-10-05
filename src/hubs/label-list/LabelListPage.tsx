// Main hub page: fetch labels, apply filters, render the two-line list — US1 (FR-001..FR-006, FR-013, FR-014).
import * as React from 'react';
import { Page } from 'azure-devops-ui/Page';
import { Card } from "azure-devops-ui/Card";
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { tfvcLabelsClient } from '../../services/tfvcLabelsClient';
import type { DataAccessError, LabelListFilterState, TfvcLabel } from '../../models/types';
import { filterLabels, getDistinctCreators } from './filterLabels';
import { LabelListFilterBar } from '../../components/LabelListFilterBar';
import { LabelRow } from '../../components/LabelRow';
import { StateMessage } from '../../components/StateMessage';
import { strings } from '../../common/strings';
import { renderListItem, ScrollableList } from 'azure-devops-ui/List';
import type { IListItemDetails, IListRow } from 'azure-devops-ui/List';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';

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
  const labelItemProvider = React.useMemo(() => new ArrayItemProvider(visibleLabels), [visibleLabels]);

  const handleFilterChanged = React.useCallback((searchText: string, creatorId: string | null) => {
    setFilterState({ searchText, creatorId });
  }, []);

  const renderLabelRow = React.useCallback(
    (index: number, label: TfvcLabel, details: IListItemDetails<TfvcLabel>) =>
      renderListItem(index, details, <LabelRow label={label} />),
    []
  );

  const handleLabelActivated = React.useCallback(
    (_event: React.SyntheticEvent<HTMLElement>, listRow: IListRow<TfvcLabel>) => {
      onOpenLabel(listRow.data.id, filterState);
    },
    [onOpenLabel, filterState]
  );

  return (
    <Page className="flex-grow">
      <Header title={strings.labelListPageTitle} titleSize={TitleSize.Large} />
      <LabelListFilterBar creators={creators} onFilterChanged={handleFilterChanged} />
      <div className="page-content page-content-top">
        <Card>
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
            <ScrollableList
              //className="tfvc-label-list"
              ariaLabel="TFVC labels"
              itemProvider={labelItemProvider}
              renderRow={renderLabelRow}
              onActivate={handleLabelActivated}
              singleClickActivation={true}
              width="100%"
            />
          )}
        </Card>
      </div>
    </Page>
  );
};
