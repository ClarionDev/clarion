import React, { useMemo, useState } from 'react';
import { AgentRun, useAppStore } from '../store/store';
import { Check, CheckCheck, Minus, FileEdit } from 'lucide-react';
import FileChangeItem from './FileChangeItem';
import Button from './ui/Button';
import { cn } from '../lib/utils';
import { applyFileChanges, FileChange } from '../lib/api';
import Notification from './ui/Notification';

interface ChangeProps {
  run: AgentRun;
}

const Change = ({ run }: ChangeProps) => {
  const {
    selectedFileChanges,
    appliedFileChanges,
    toggleFileChangeSelection,
    toggleAllFileChangeSelections,
    markChangesAsApplied,
    currentProject,
    refreshFileTree,
  } = useAppStore();

  const projectRoot = currentProject?.path;

  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const selectedPaths = useMemo(() => selectedFileChanges.get(run.id) || new Set(), [selectedFileChanges, run.id]);
  const appliedPaths = useMemo(() => appliedFileChanges.get(run.id) || new Set(), [appliedFileChanges, run.id]);
  const allPaths = useMemo(() => run.output?.fileChanges.map(fc => fc.path) || [], [run.output]);
  const unappliedPaths = useMemo(() => allPaths.filter(p => !appliedPaths.has(p)), [allPaths, appliedPaths]);

  const selectionStatus = useMemo(() => {
    if (unappliedPaths.length === 0) return 'all_applied';
    const selectedUnappliedCount = unappliedPaths.filter(p => selectedPaths.has(p)).length;
    if (selectedUnappliedCount === 0) return 'none';
    if (selectedUnappliedCount === unappliedPaths.length) return 'all';
    return 'some';
  }, [selectedPaths, unappliedPaths]);

  const handleApplyChanges = async () => {
    if (!projectRoot) return;
    
    const changesToApply: FileChange[] = (run.output?.fileChanges || []).filter(fc => selectedPaths.has(fc.path) && !appliedPaths.has(fc.path));
    if (changesToApply.length === 0) return;

    setIsLoading(true);
    const result = await applyFileChanges({ root_path: projectRoot, changes: changesToApply });
    
    if (result.success) {
        await refreshFileTree();
        markChangesAsApplied(run.id, changesToApply.map(c => c.path));
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    } else {
        alert(`Failed to apply changes: ${result.error}`);
    }
    setIsLoading(false);
  };

  if (!run.output || !run.output.fileChanges || run.output.fileChanges.length === 0) {
    return null;
  }
  
  const { fileChanges } = run.output;
  const changesToApplyCount = fileChanges.filter(fc => selectedPaths.has(fc.path) && !appliedPaths.has(fc.path)).length;

  return (
    <div className="bg-gray-dark/50 rounded-lg border border-gray-light overflow-hidden">
      <div className="p-3 border-b border-gray-light flex justify-between items-center bg-gray-medium/30">
        <div className='flex items-center gap-2'>
            <FileEdit size={16} className='text-accent-blue'/>
            <h4 className='font-semibold text-sm'>Proposed File Changes ({fileChanges.length})</h4>
        </div>
      </div>
      <div className="p-3 space-y-3">
          <div className='flex justify-between items-center pb-2 border-b border-gray-light/50'>
              <div 
                  onClick={() => {
                    if (selectionStatus === 'all_applied') return;
                    toggleAllFileChangeSelections(run.id, unappliedPaths, selectionStatus !== 'all');
                  }}
                  className={cn(
                    'flex items-center gap-2 p-1 -ml-1 rounded-md hover:bg-gray-light/30',
                    selectionStatus === 'all_applied' ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <span className={cn('flex items-center justify-center h-4 w-4 rounded border transition-colors',
                      {
                        'bg-transparent border-gray-light': selectionStatus === 'none',
                        'bg-accent-blue border-accent-blue': selectionStatus === 'all',
                        'bg-gray-light border-gray-light': selectionStatus === 'all_applied',
                        'bg-accent-blue/50 border-accent-blue': selectionStatus === 'some',
                      }
                  )}>
                      {selectionStatus === 'all' && <Check className="w-3 h-3 text-white" />}
                      {selectionStatus === 'some' && <Minus className="w-3 h-3 text-white" />}
                      {selectionStatus === 'all_applied' && <CheckCheck className="w-3 h-3 text-text-primary" />}
                  </span>
                  <span className='text-xs font-medium text-text-secondary'>{selectedPaths.size} of {allPaths.length} selected</span>
              </div>
              <Button size="sm" onClick={handleApplyChanges} disabled={isLoading || changesToApplyCount === 0}>
                  {isLoading ? 'Applying...' : <><CheckCheck size={16} className="mr-2" /> Apply {changesToApplyCount > 0 ? changesToApplyCount : ''} Change(s)</>}
              </Button>
          </div>

          <div className="space-y-2">
            {fileChanges.map(change => (
              <FileChangeItem
                key={change.id || change.path}
                fileChange={change}
                isSelected={selectedPaths.has(change.path)}
                onSelectionChange={() => toggleFileChangeSelection(run.id, change.path)}
                isApplied={appliedPaths.has(change.path)}
              />
            ))}
          </div>
        </div>
        
      <Notification 
        show={showNotification} 
        onDismiss={() => setShowNotification(false)} 
        message='Changes applied successfully!' 
      />
    </div>
  );
};

export default Change;
