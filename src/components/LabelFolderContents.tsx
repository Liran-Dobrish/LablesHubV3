// Right-hand panel: direct files/folders under the selected tree node — FR-011/FR-012, with simple pagination
// for the "very large folder" edge case in spec.md.
import * as React from 'react';
import { Button } from 'azure-devops-ui/Button';
import { Table, SimpleTableCell, renderEmptyCell } from 'azure-devops-ui/Table';
import type { ITableColumn } from 'azure-devops-ui/Table';
import { renderListCell } from 'azure-devops-ui/List';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';
import { tfvcLabelsClient } from '../services/tfvcLabelsClient';
import type { DataAccessError, LabelItem } from '../models/types';
import { formatCreatedDate } from '../common/formatting';
import { StateMessage } from './StateMessage';
import { strings } from '../common/strings';

export interface LabelFolderContentsProps {
  labelId: string;
  folderPath: string;
}

const PAGE_SIZE = 200;

// LabelItem isn't an ISimpleTableCell (no index signature), so cells are built via
// SimpleTableCell/renderListCell directly instead of the generic renderSimpleCell helpers.
function renderNameCell(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<LabelItem>,
  tableItem: LabelItem,
  ariaRowIndex?: number
): JSX.Element {
  return SimpleTableCell({
    columnIndex,
    tableColumn,
    ariaRowIndex,
    children: renderListCell({
      text: tableItem.name,
      iconProps: { iconName: tableItem.type === 'folder' ? 'FabricFolder' : 'Page' },
    }),
  });
}

function renderChangesetCell(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<LabelItem>,
  tableItem: LabelItem,
  ariaRowIndex?: number
): JSX.Element {
  return SimpleTableCell({ columnIndex, tableColumn, ariaRowIndex, children: renderListCell(tableItem.changeset) });
}

function renderCheckedInDateCell(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<LabelItem>,
  tableItem: LabelItem,
  ariaRowIndex?: number
): JSX.Element {
  return SimpleTableCell({
    columnIndex,
    tableColumn,
    ariaRowIndex,
    children: renderListCell(tableItem.checkedInDate ? formatCreatedDate(tableItem.checkedInDate) : ''),
  });
}

// "Additional" has no backing data yet; the column is reserved for future use.
function renderAdditionalCell(rowIndex: number, columnIndex: number): JSX.Element {
  return renderEmptyCell(rowIndex, columnIndex);
}

const columns: ITableColumn<LabelItem>[] = [
  { id: 'name', name: strings.folderContentsNameColumn, renderCell: renderNameCell, width: -40 },
  { id: 'changeset', name: strings.folderContentsChangesetColumn, renderCell: renderChangesetCell, width: -15 },
  { id: 'checkedInDate', name: strings.folderContentsCheckedInDateColumn, renderCell: renderCheckedInDateCell, width: -30 },
  { id: 'additional', name: strings.folderContentsAdditionalColumn, renderCell: renderAdditionalCell, width: -15 },
];

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
  const itemProvider = new ArrayItemProvider(visibleItems);

  return (
    <div className="tfvc-label-folder-contents">
      <Table<LabelItem>
        ariaLabel={strings.folderContentsAriaLabel}
        columns={columns}
        itemProvider={itemProvider}
      />
      {visibleCount < items.length && (
        <Button
          text={`Show more (${items.length - visibleCount} remaining)`}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        />
      )}
    </div>
  );
};

