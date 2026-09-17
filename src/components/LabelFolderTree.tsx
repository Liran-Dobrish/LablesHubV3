// Folder tree seeded from the label's scope path; lazily loads children on expand — FR-010, US3.
//
// Note: azure-devops-ui's Tree/TreeEx is a table-backed component with a more involved
// column/item-provider contract; this component instead renders a small self-contained
// recursive tree (using azure-devops-ui/Icon for chevrons/folder icons) to keep the
// selection/lazy-load logic simple and easy to verify. It can be swapped for the full
// Tree/TreeEx component later if pixel-parity with other ADO tree UIs is required.
import * as React from 'react';
import { Icon } from 'azure-devops-ui/Icon';
import { tfvcLabelsClient } from '../services/tfvcLabelsClient';
import type { LabelFolderNode, TfvcLabel } from '../models/types';
import { leafSegment } from '../common/formatting';
import { strings } from '../common/strings';

export interface LabelFolderTreeProps {
  label: TfvcLabel;
  selectedPath: string | null;
  onSelectNode: (path: string) => void;
}

interface TreeNodeState {
  node: LabelFolderNode;
  expanded: boolean;
  loaded: boolean;
  children: LabelFolderNode[];
}

export const LabelFolderTree: React.FC<LabelFolderTreeProps> = ({ label, selectedPath, onSelectNode }) => {
  const [nodes, setNodes] = React.useState<Map<string, TreeNodeState>>(new Map());
  const [rootPath, setRootPath] = React.useState<string | null>(null);

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
    void (async () => {
      const children = await loadChildren(label.scopePath);
      if (cancelled) {
        return;
      }
      const rootNode: LabelFolderNode = {
        path: label.scopePath,
        name: leafSegment(label.scopePath) || label.scopePath,
        parentPath: null,
        hasChildren: children.length > 0,
      };
      const initial = new Map<string, TreeNodeState>();
      initial.set(rootNode.path, { node: rootNode, expanded: true, loaded: true, children });
      for (const child of children) {
        initial.set(child.path, { node: child, expanded: false, loaded: false, children: [] });
      }
      setNodes(initial);
      setRootPath(rootNode.path);
    })();
    return () => {
      cancelled = true;
    };
  }, [label.id, label.scopePath, loadChildren]);

  const toggleExpand = React.useCallback(
    (path: string) => {
      setNodes((current) => {
        const existing = current.get(path);
        if (!existing) {
          return current;
        }
        const next = new Map(current);
        next.set(path, { ...existing, expanded: !existing.expanded });
        return next;
      });

      const existing = nodes.get(path);
      if (existing && !existing.loaded) {
        void loadChildren(path).then((children) => {
          setNodes((current) => {
            const node = current.get(path);
            if (!node) {
              return current;
            }
            const next = new Map(current);
            next.set(path, { ...node, loaded: true, children });
            for (const child of children) {
              if (!next.has(child.path)) {
                next.set(child.path, { node: child, expanded: false, loaded: false, children: [] });
              }
            }
            return next;
          });
        });
      }
    },
    [nodes, loadChildren]
  );

  const renderNode = (path: string, depth: number): React.ReactNode => {
    const state = nodes.get(path);
    if (!state) {
      return null;
    }
    const isSelected = selectedPath === path;

    return (
      <div key={path}>
        <div
          className={`tfvc-folder-tree-node flex-row flex-center${isSelected ? ' selected' : ''}`}
          style={{ paddingLeft: depth * 16 }}
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={state.node.hasChildren ? state.expanded : undefined}
          tabIndex={0}
          onClick={() => onSelectNode(path)}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              onSelectNode(path);
            }
          }}
        >
          {state.node.hasChildren ? (
            <Icon
              iconName={state.expanded ? 'ChevronDown' : 'ChevronRight'}
              ariaLabel={state.expanded ? strings.folderTreeCollapse : strings.folderTreeExpand}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpand(path);
              }}
            />
          ) : (
            <span style={{ width: 16, display: 'inline-block' }} />
          )}
          <Icon iconName="FabricFolder" />
          <span className="body-m">{state.node.name}</span>
        </div>
        {state.expanded && state.children.map((child) => renderNode(child.path, depth + 1))}
      </div>
    );
  };

  if (!rootPath) {
    return null;
  }

  return (
    <div className="tfvc-label-folder-tree" role="tree" aria-label={strings.folderTreeAriaLabel}>
      {renderNode(rootPath, 0)}
    </div>
  );
};
