// Folder tree seeded from the label's scope path; lazily loads children on expand — FR-010, US3.
import * as React from 'react';
import { Tree, renderTreeRow, renderExpandableTreeCell } from 'azure-devops-ui/TreeEx';
import type { ITreeColumn, ITreeRow } from 'azure-devops-ui/TreeEx';
import { TreeItemProvider } from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { ITreeItem, ITreeItemEx } from 'azure-devops-ui/Utilities/TreeItemProvider';
import type { IItemProvider } from 'azure-devops-ui/Utilities/Provider';
import type { IReadonlyObservableValue } from 'azure-devops-ui/Core/Observable';
import type { ISimpleListCell } from 'azure-devops-ui/List';
import type { ISimpleTableCell } from 'azure-devops-ui/Table';
import { tfvcLabelsClient } from '../services/tfvcLabelsClient';
import type { LabelFolderNode, TfvcLabel } from '../models/types';
import { leafSegment } from '../common/formatting';
import { strings } from '../common/strings';

export interface LabelFolderTreeProps {
  label: TfvcLabel;
  selectedPath: string | null;
  onSelectNode: (path: string) => void;
}

interface FolderCellData extends ISimpleTableCell {
  name: ISimpleListCell;
}

// Placeholder id for the single "loading" child inserted while a folder's real children are fetched.
const LOADING_PLACEHOLDER_ID = '__loading__';

const columns: ITreeColumn<FolderCellData>[] = [
  { id: 'name', renderCell: renderExpandableTreeCell, width: -100, hierarchical: true },
];

function createLoadingPlaceholder(): ITreeItem<FolderCellData> {
  return { id: LOADING_PLACEHOLDER_ID, data: { name: { text: strings.folderTreeLoading } } };
}

function buildTreeItem(node: LabelFolderNode): ITreeItem<FolderCellData> {
  const item: ITreeItem<FolderCellData> = {
    id: node.path,
    data: { name: { text: node.name, iconProps: { iconName: 'FabricFolder' } } },
  };
  if (node.hasChildren) {
    item.childItems = [createLoadingPlaceholder()];
  }
  return item;
}

// The tree's itemProvider prop accepts items that may individually be wrapped in an observable;
// TreeItemProvider never wraps them, so this alias widens the type to satisfy that contract.
type TreeCellItemProvider = IItemProvider<ITreeItemEx<FolderCellData> | IReadonlyObservableValue<ITreeItemEx<FolderCellData>>>;

export const LabelFolderTree: React.FC<LabelFolderTreeProps> = ({ label, selectedPath, onSelectNode }) => {
  const [treeItemProvider, setTreeItemProvider] = React.useState<TreeItemProvider<FolderCellData> | null>(null);
  const loadedPaths = React.useRef(new Set<string>());

  const loadChildren = React.useCallback(
    async (path: string): Promise<LabelFolderNode[]> => {
      const items = await tfvcLabelsClient.getLabelFolderContents(label.id, path);
      return items
        .filter((item) => item.type === 'folder')
        .map((item) => ({ path: item.path, name: item.name, parentPath: path, hasChildren: true }));
    },
    [label.id]
  );

  React.useEffect(() => {
    let cancelled = false;
    loadedPaths.current = new Set();
    void (async () => {
      const children = await loadChildren(label.scopePath);
      if (cancelled) {
        return;
      }
      const rootItem: ITreeItem<FolderCellData> = {
        id: label.scopePath,
        data: { name: { text: leafSegment(label.scopePath) || label.scopePath, iconProps: { iconName: 'FabricFolder' } } },
        expanded: true,
        childItems: children.length > 0 ? children.map(buildTreeItem) : undefined,
      };
      loadedPaths.current.add(label.scopePath);
      setTreeItemProvider(new TreeItemProvider<FolderCellData>([rootItem]));
    })();
    return () => {
      cancelled = true;
    };
  }, [label.id, label.scopePath, loadChildren]);

  const handleToggle = React.useCallback(
    (_event: React.SyntheticEvent<HTMLElement>, treeItem: ITreeItemEx<FolderCellData>) => {
      if (!treeItemProvider) {
        return;
      }
      const underlyingItem = treeItem.underlyingItem;
      const path = underlyingItem.id;
      if (!path) {
        return;
      }
      treeItemProvider.toggle(underlyingItem);
      if (underlyingItem.expanded && !loadedPaths.current.has(path)) {
        const placeholder = underlyingItem.childItems?.[0];
        void loadChildren(path).then((children) => {
          loadedPaths.current.add(path);
          treeItemProvider.splice(underlyingItem, placeholder ? [placeholder] : undefined, [
            { items: children.map(buildTreeItem) },
          ]);
        });
      }
    },
    [treeItemProvider, loadChildren]
  );

  const handleSelect = React.useCallback(
    (_event: React.SyntheticEvent<HTMLElement>, treeRow: ITreeRow<FolderCellData>) => {
      const path = treeRow.data.underlyingItem.id;
      if (path) {
        onSelectNode(path);
      }
    },
    [onSelectNode]
  );

  const renderRow = React.useCallback(
    (rowIndex: number, item: ITreeItemEx<FolderCellData>, details: Parameters<typeof renderTreeRow<FolderCellData>>[2]) => {
      const isSelected = item.underlyingItem.id !== undefined && item.underlyingItem.id === selectedPath;
      return renderTreeRow(rowIndex, item, details, columns, undefined, isSelected ? 'selected' : undefined, item.underlyingItem.id);
    },
    [selectedPath]
  );

  if (!treeItemProvider) {
    return null;
  }

  return (
    <Tree<FolderCellData>
      className="tfvc-label-folder-tree"
      columns={columns}
      itemProvider={treeItemProvider as unknown as TreeCellItemProvider}
      renderRow={renderRow}
      onSelect={handleSelect}
      onActivate={handleSelect}
      onToggle={handleToggle}
      showHeader={false}
      scrollable={false}
    />
  );
};

