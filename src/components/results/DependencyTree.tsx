import { useCallback, useMemo, useState } from 'react';
import type { DependencyNode } from '../../../assets/js/contracts';
import { resources } from '../../../assets/js/data/resources';
import { ResourceTargetButton } from '../shared/ResourceTargetButton';

function collectCollapsibleKeys(node: DependencyNode, keyPath: string): string[] {
  const selfKey = `${keyPath}/${node.id}`;
  let keys: string[] = [];
  if (node.children.length > 0) {
    keys.push(selfKey);
    for (let i = 0; i < node.children.length; i++) {
      keys.push(
        ...collectCollapsibleKeys(node.children[i]!, `${selfKey}/${i}`),
      );
    }
  }
  return keys;
}

function TreeBranch({
  node,
  keyPath,
  depth,
  currentResourceId,
  onSetTarget,
  collapsedKeys,
  toggleKey,
}: {
  node: DependencyNode;
  keyPath: string;
  depth: number;
  currentResourceId: string;
  onSetTarget: (id: string) => void;
  collapsedKeys: Set<string>;
  toggleKey: (key: string) => void;
}) {
  const selfKey = `${keyPath}/${node.id}`;
  const hasChildren = node.children.length > 0;
  const unit = resources[node.id]?.unit ?? '';
  const isExpanded = !collapsedKeys.has(selfKey);

  const toggleOrSpacer = hasChildren ? (
    <button
      type="button"
      className="tree-toggle"
      aria-expanded={isExpanded ? 'true' : 'false'}
      aria-label="Toggle child dependencies"
      onClick={(e) => {
        e.stopPropagation();
        toggleKey(selfKey);
      }}
    >
      <span className="tree-toggle-chevron" aria-hidden="true"></span>
    </button>
  ) : (
    <span className="tree-toggle-spacer" aria-hidden="true"></span>
  );

  const arrow = depth > 0 ? <span className="tree-arrow">&#x2514;</span> : null;

  return (
    <div
      className={`tree-branch${hasChildren && !isExpanded ? ' tree-collapsed' : ''}`}
    >
      <div
        className={`tree-node tree-depth-${depth}`}
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        {toggleOrSpacer}
        {arrow}
        <ResourceTargetButton
          id={node.id}
          label={node.label}
          currentResourceId={currentResourceId}
          onSetTarget={onSetTarget}
          extraClassName="tree-label"
        />
        <span className="tree-amount">
          {node.amount.toFixed(2)} {unit}
        </span>
      </div>
      {hasChildren && (
        <div className="tree-children" hidden={!isExpanded}>
          {node.children.map((c, i) => (
            <TreeBranch
              key={`${selfKey}-${i}-${c.id}`}
              node={c}
              keyPath={`${selfKey}/${i}`}
              depth={depth + 1}
              currentResourceId={currentResourceId}
              onSetTarget={onSetTarget}
              collapsedKeys={collapsedKeys}
              toggleKey={toggleKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DependencyTree({
  tree,
  currentResourceId,
  onSetTarget,
}: {
  tree: DependencyNode;
  currentResourceId: string;
  onSetTarget: (id: string) => void;
}) {
  const allCollapsibleKeys = useMemo(
    () => collectCollapsibleKeys(tree, 'root'),
    [tree],
  );

  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());

  const toggleKey = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedKeys(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedKeys(new Set(allCollapsibleKeys));
  }, [allCollapsibleKeys]);

  return (
    <>
      <div className="tree-toolbar" role="toolbar" aria-label="Dependency tree view">
        <button type="button" className="btn btn-secondary tree-bulk-btn" onClick={expandAll}>
          Expand all
        </button>
        <button type="button" className="btn btn-secondary tree-bulk-btn" onClick={collapseAll}>
          Collapse all
        </button>
      </div>
      <div id="tree-list" className="tree-container">
        <TreeBranch
          node={tree}
          keyPath="root"
          depth={0}
          currentResourceId={currentResourceId}
          onSetTarget={onSetTarget}
          collapsedKeys={collapsedKeys}
          toggleKey={toggleKey}
        />
      </div>
    </>
  );
}
