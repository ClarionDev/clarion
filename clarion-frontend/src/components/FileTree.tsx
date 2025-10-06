import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { TreeNodeData } from '../data/file-tree';
import TreeNode from './TreeNode';

interface FileTreeProps {
  nodes: TreeNodeData[];
  onContextMenu: (event: React.MouseEvent, node: TreeNodeData) => void;
}

interface FlattenedNode {
  node: TreeNodeData;
  level: number;
}

const flattenTree = (nodes: TreeNodeData[], level = 0, expandedIds: Set<string>): FlattenedNode[] => {
  let flattened: FlattenedNode[] = [];
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  for (const node of sortedNodes) {
    flattened.push({ node, level });
    if (node.type === 'folder' && node.children && expandedIds.has(node.id)) {
      flattened = flattened.concat(flattenTree(node.children, level + 1, expandedIds));
    }
  }
  return flattened;
};

const FileTree = ({ nodes, onContextMenu }: FileTreeProps) => {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(['project-root']));

  const toggleNode = (nodeId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const flattenedNodes = React.useMemo(() => flattenTree(nodes, 0, expandedIds), [nodes, expandedIds]);

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const { node, level } = flattenedNodes[index];
    return (
      <div style={style}>
        <TreeNode
          node={node}
          level={level}
          isExpanded={expandedIds.has(node.id)}
          onToggle={toggleNode}
          onContextMenu={onContextMenu}
        />
      </div>
    );
  };

  return (
    <div className="h-full w-full">
      <List
        height={800} // This should ideally be dynamic based on parent height
        itemCount={flattenedNodes.length}
        itemSize={24} // Height of each row
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};

export default FileTree;
