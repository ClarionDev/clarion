import React, { useMemo, MouseEvent } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { TreeNodeData } from '../data/file-tree';
import { cn } from '../lib/utils';
import FileIcon from './FileIcon';
import { useAppStore } from '../store/store';

interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  onContextMenu: (event: React.MouseEvent, node: TreeNodeData) => void;
}

const TreeNode = ({ node, level = 0, isExpanded, onToggle, onContextMenu }: TreeNodeProps) => {
  const { 
    contextFilePaths, 
    agentFilteredFilePaths, 
    activeAgent,
    toggleFileForContext, 
    openFile,
    activeFileId 
  } = useAppStore();

  const isFolder = node.type === 'folder';
  const hasFilters = activeAgent && (activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0);

  const handleNodeClick = () => {
    if (isFolder) {
      onToggle(node.id);
    }
    openFile(node);
  };

  const handleCheckboxClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (hasFilters) return;
    toggleFileForContext(node);
  };

  const selectionStatus = useMemo(() => {
    const getPaths = (n: TreeNodeData): string[] => {
        if (n.type === 'file') return [n.path];
        return n.children?.flatMap(getPaths) || [];
    }
    const allChildPaths = getPaths(node);

    const checkStatus = (selectedSet: Set<string>) => {
        if (allChildPaths.length === 0) return 'unchecked';
        const selectedCount = allChildPaths.filter(path => selectedSet.has(path)).length;
        if (selectedCount === 0) return 'unchecked';
        if (selectedCount === allChildPaths.length) return 'checked';
        return 'indeterminate';
    }

    return checkStatus(hasFilters ? agentFilteredFilePaths : contextFilePaths);

  }, [contextFilePaths, agentFilteredFilePaths, node, hasFilters]);

  const isSelectedForView = activeFileId === node.id;

  return (
    <div
      className={cn(
        'flex items-center py-0.5 rounded-sm cursor-pointer h-[24px]',
        'hover:bg-gray-light/50',
        { 'bg-gray-light/75 text-text-primary': isSelectedForView }
      )}
      style={{ paddingLeft: `${level * 1.25}rem` }}
      onClick={handleNodeClick}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <div className="flex items-center w-full">
          <div className="w-4 h-4 mr-1 flex-shrink-0 flex items-center justify-center">
              {isFolder && (
              <ChevronRight
                  className={cn('w-4 h-4 transition-transform', { 'rotate-90': isExpanded })}
              />
              )}
          </div>

          <div onClick={handleCheckboxClick} className={cn("mr-2 flex-shrink-0 h-4 w-4", { 'cursor-not-allowed': hasFilters } )}>
            <input
                type="checkbox"
                className='sr-only'
                checked={selectionStatus === 'checked'}
                ref={input => {
                    if (input) input.indeterminate = selectionStatus === 'indeterminate';
                }}
                onChange={() => {}}
                tabIndex={-1}
            />
            <span className={cn('flex items-center justify-center h-4 w-4 rounded border transition-colors',
              {
                'bg-transparent border-gray-light': selectionStatus === 'unchecked',
                'bg-accent-blue border-accent-blue': selectionStatus === 'checked',
                'bg-accent-blue/50 border-accent-blue/50': selectionStatus === 'indeterminate',
                'opacity-60': hasFilters
              }
            )}>
              {(selectionStatus === 'checked' || selectionStatus === 'indeterminate') && <Check className="w-3 h-3 text-white" />}
            </span>
          </div>

          <FileIcon filename={node.name} type={node.type} isExpanded={isExpanded} />

          <span className="truncate text-sm flex-grow">{node.name}</span>
      </div>
    </div>
  );
};

export default React.memo(TreeNode);
