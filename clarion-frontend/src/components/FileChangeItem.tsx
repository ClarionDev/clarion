import React from 'react';
import { FileChange } from '../lib/api';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import FileIcon from './FileIcon';
import { useAppStore } from '../store/store';

const getActionPill = (action: FileChange['action']) => {
    const baseClasses = 'text-xs font-semibold px-1.5 py-0.5 rounded';
    switch (action) {
        case 'create':
            return <span className={cn(baseClasses, 'bg-green-500/10 text-green-400')}>CREATE</span>;
        case 'modify':
            return <span className={cn(baseClasses, 'bg-yellow-500/10 text-yellow-400')}>MODIFY</span>;
        case 'delete':
            return <span className={cn(baseClasses, 'bg-red-500/10 text-red-400')}>DELETE</span>;
    }
}

interface FileChangeItemProps {
  fileChange: FileChange;
  isSelected: boolean;
  isApplied: boolean;
  onSelectionChange: (path: string) => void;
}

const FileChangeItem = ({ fileChange, isSelected, isApplied, onSelectionChange }: FileChangeItemProps) => {
  const { openDiff } = useAppStore();

  const parts = fileChange.path.replace(/\\/g, '/').split('/');
  const fileName = parts.pop() || '';
  const directoryPath = parts.join('/');

  return (
    <div 
        className='bg-gray-dark/50 rounded-md border border-gray-light overflow-hidden transition-all duration-150 flex items-center w-full gap-2 px-2 py-1 hover:border-accent-blue/50'
    >
      <div className='flex-shrink-0 w-16 text-center'>
          {getActionPill(fileChange.action)}
      </div>
      
      <div 
        onClick={(e) => {
            if (isApplied) return;
            e.stopPropagation();
            onSelectionChange(fileChange.path);
        }}
        className={cn('flex-shrink-0 flex items-center justify-center p-1.5 rounded-md', isApplied ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-light/50')}
      >
        <span className={cn('flex items-center justify-center h-4 w-4 rounded border transition-colors', {
            'bg-transparent border-gray-light': !isSelected && !isApplied,
            'bg-accent-blue border-accent-blue': isSelected && !isApplied,
            'bg-gray-light/50 border-gray-light': isApplied,
        })}>
            {isApplied ? <CheckCheck className="w-3 h-3 text-text-primary" /> : (isSelected && <Check className="w-3 h-3 text-white" />)}
        </span>
      </div>

      <button onClick={() => openDiff(fileChange)} className='flex-grow min-w-0 flex items-center gap-2 text-left px-2 py-1 rounded-md hover:bg-gray-light/30'>
          <FileIcon filename={fileName} type='file'/>
          <div className='flex-grow min-w-0 truncate'>
            <span className='block text-sm text-text-primary truncate font-medium'>{fileName}</span>
            {directoryPath && (
                <span className='block font-mono text-xs text-text-secondary truncate'>{directoryPath}</span>
            )}
          </div>
      </button>
    </div>
  );
};

export default React.memo(FileChangeItem);
