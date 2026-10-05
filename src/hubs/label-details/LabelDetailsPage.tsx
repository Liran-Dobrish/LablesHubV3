// Label details: header (back + name), read-only description, folder tree/contents — US2 + US3.
import * as React from 'react';
import { Page } from 'azure-devops-ui/Page';
import { Header, TitleSize } from 'azure-devops-ui/Header';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { SingleLayerMasterPanel, SingleLayerMasterPanelHeader } from 'azure-devops-ui/MasterDetails';
import { tfvcLabelsClient } from '../../services/tfvcLabelsClient';
import type { DataAccessError, TfvcLabel } from '../../models/types';
import { LabelDescriptionView } from '../../components/LabelDescriptionView';
import { LabelFolderTree } from '../../components/LabelFolderTree';
import { LabelFolderContents } from '../../components/LabelFolderContents';
import { StateMessage } from '../../components/StateMessage';
import { strings } from '../../common/strings';
import { Card } from 'azure-devops-ui/Card';

export interface LabelDetailsPageProps {
  labelId: string;
  onBack: () => void;
}

type LoadState = 'loading' | 'loaded' | 'error';

export const LabelDetailsPage: React.FC<LabelDetailsPageProps> = ({ labelId, onBack }) => {
  const [label, setLabel] = React.useState<TfvcLabel | null>(null);
  const [loadState, setLoadState] = React.useState<LoadState>('loading');
  const [error, setError] = React.useState<DataAccessError | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = React.useState<string | null>(null);

  const loadLabel = React.useCallback(() => {
    setLoadState('loading');
    setError(null);
    tfvcLabelsClient
      .getLabel(labelId)
      .then((result) => {
        setLabel(result);
        setSelectedFolderPath(result.scopePath);
        setLoadState('loaded');
      })
      .catch((err: DataAccessError) => {
        setError(err);
        setLoadState('error');
      });
  }, [labelId]);

  React.useEffect(() => {
    loadLabel();
  }, [loadLabel]);

  return (
    <Page className="tfvc-label-details-page flex-grow">
      <Header
        title={label?.name ?? strings.labelDetailsFallbackTitle}
        titleSize={TitleSize.Large}
        backButtonProps={{ onClick: () => onBack() }}
      />

      {loadState === 'loading' && <Spinner size={SpinnerSize.large} label={strings.labelDetailsLoading} />}

      {loadState === 'error' && (
        <StateMessage
          kind="error"
          primaryText={
            error?.kind === 'not-found' ? strings.labelDetailsNotFoundTitle : strings.labelDetailsLoadErrorTitle
          }
          secondaryText={error?.message}
          onRetry={loadLabel}
        />
      )}

      {loadState === 'loaded' && label && (
        <div className="page-content page-content-top">
          <section className="tfvc-label-description-section">
            <Card className="flex-grow">
              <LabelDescriptionView description={label.description} />
            </Card>
          </section>
          <Card className="flex-grow">
            <section className="tfvc-label-contents-section flex-row">
              <SingleLayerMasterPanel
                className="tfvc-label-folder-tree-pane"
                renderHeader={() => <SingleLayerMasterPanelHeader title={strings.folderTreePanelTitle} />}
                renderContent={() => (
                  <LabelFolderTree label={label} selectedPath={selectedFolderPath} onSelectNode={setSelectedFolderPath} />
                )}
              />
              <div className="tfvc-label-folder-contents-pane flex-grow">
                {selectedFolderPath && <LabelFolderContents labelId={label.id} folderPath={selectedFolderPath} />}
              </div>
            </section>
          </Card>
        </div>
      )}
    </Page>
  );
};
