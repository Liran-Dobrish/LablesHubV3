// Right-hand panel: direct files/folders under the selected tree node — FR-011/FR-012, with simple pagination
// for the "very large folder" edge case in spec.md.
import * as React from 'react';
import { Icon } from 'azure-devops-ui/Icon';
import { Button } from 'azure-devops-ui/Button';
import { tfvcLabelsClient } from '../services/tfvcLabelsClient';
import type { DataAccessError, LabelItem } from '../models/types';
import { StateMessage } from './StateMessage';
import { strings } from '../common/strings';

export interface LabelFolderContentsProps {
  labelId: string;
  folderPath: string;
}

const PAGE_SIZE = 200;

export const LabelFolderContents: React.FC<LabelFolderContentsProps> = ({ labelId, folderPath }) => {
  const [items, setItems] = React.useState<LabelItem[] | null>(null);
  const [error, setError] = React.useState<DataAccessError | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const load = React.useCallback(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    setVisibleCount(PAGE_SIZE);
    tfvcLabelsClient
      .getLabelFolderContents(labelId, folderPath)
      .then((result) => {
        if (!cancelled) {
          setItems(result);
        }
      })
      .catch((err: DataAccessError) => {
        if (!cancelled) {
          setError(err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [labelId, folderPath]);

  React.useEffect(() => load(), [load]);

  if (error) {
    return (
      <StateMessage
        kind="error"
        primaryText={strings.folderContentsLoadErrorTitle}
        secondaryText={error.message}
        onRetry={load}
      />
    );
  }

  if (!items) {
    return null;
  }

  if (items.length === 0) {
    return <StateMessage kind="empty" primaryText={strings.folderContentsEmpty} />;
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="tfvc-label-folder-contents" role="table" aria-label={strings.folderContentsAriaLabel}>
      {visibleItems.map((item) => (
        <div key={item.path} role="row" className="tfvc-label-folder-contents-row flex-row flex-center">
          <Icon iconName={item.type === 'folder' ? 'FabricFolder' : 'Page'} />
          <span className="body-m">{item.name}</span>
        </div>
      ))}
      {visibleCount < items.length && (
        <Button
          text={`Show more (${items.length - visibleCount} remaining)`}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        />
      )}
    </div>
  );
};
