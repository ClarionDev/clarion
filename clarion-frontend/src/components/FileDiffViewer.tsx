import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { FileChange } from '../lib/api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/Accordion';
import { Check, ArrowRight, CheckCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import FileIcon from './FileIcon';
import { useState } from 'react';
import { useAppStore } from '../store/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

interface FileDiffViewerProps {
  fileChange: FileChange;
  isSelected: boolean;
  isApplied: boolean;
  onSelectionChange: (path: string) => void;
}

const diffViewerStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1a1a1a',
      diffViewerColor: '#f0f0f0',
      addedBackground: 'rgba(16, 185, 129, 0.1)',
      addedColor: '#f0f0f0',
      removedBackground: 'rgba(239, 68, 68, 0.1)',
      removedColor: '#f0f0f0',
      wordAddedBackground: 'rgba(16, 185, 129, 0.25)',
      wordRemovedBackground: 'rgba(239, 68, 68, 0.25)',
      addedGutterBackground: 'rgba(16, 185, 129, 0.15)',
      removedGutterBackground: 'rgba(239, 68, 68, 0.15)',
      gutterBackground: '#2a2a2a',
      gutterBackgroundDark: '#1a1a1a',
      gutterColor: '#a0a0a0',
      addedGutterColor: '#a0a0a0',
      removedGutterColor: '#a0a0a0',
      diffViewerTitleBackground: '#2a2a2a',
      diffViewerTitleColor: '#f0f0f0',
      diffViewerTitleBorderColor: '#3c3c3c',
    },
  },
  line: {
    padding: '8px 4px',
  },
  marker: {
    fontSize: '1em'
  }
};

const getActionPill = (action: FileChange['action']) => {
    const baseClasses = 'text-xs font-bold px-2 py-0.5 rounded-full border';
    switch (action) {
        case 'create':
            return <span className={cn(baseClasses, 'bg-green-500/10 text-green-400 border-green-500/30')}>CREATE</span>;
        case 'modify':
            return <span className={cn(baseClasses, 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30')}>MODIFY</span>;
        case 'delete':
            return <span className={cn(baseClasses, 'bg-red-500/10 text-red-400 border-red-500/30')}>DELETE</span>;
    }
}

const FileDiffViewer = ({ fileChange, isSelected, isApplied, onSelectionChange }: FileDiffViewerProps) => {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { openDiff } = useAppStore();

  const parts = fileChange.path.replace(/\\/g, '/').split('/');
  const fileName = parts.pop() || '';
  const directoryPath = parts.join('/');

  const TriggerContentWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn('flex items-center w-full gap-3 p-2.5', className)}>
        {children}
    </div>
  );

  return (
    <div className='bg-gray-dark rounded-lg border border-gray-light overflow-hidden'>
      <Accordion value={openItem} onValueChange={setOpenItem}>
        <AccordionItem value={fileChange.id || fileChange.path} className='border-none'>
          <TriggerContentWrapper className='data-[state=open]:bg-gray-medium/50 hover:bg-gray-light/20'>
             <div 
                  onClick={(e) => {
                      if (isApplied) return;
                      e.stopPropagation();
                      onSelectionChange(fileChange.path);
                  }}
                  className={cn(
                    'flex-shrink-0 h-full flex items-center justify-center p-1 -ml-1',
                    isApplied ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
              >
                <span className={cn('flex items-center justify-center h-4 w-4 rounded border transition-colors',
                    {
                        'bg-transparent border-gray-light': !isSelected && !isApplied,
                        'bg-accent-blue border-accent-blue': isSelected && !isApplied,
                        'bg-gray-light/50 border-gray-light': isApplied,
                    }
                )}>
                    {isApplied ? <CheckCheck className="w-3 h-3 text-text-primary" /> : (isSelected && <Check className="w-3 h-3 text-white" />)}
                </span>
              </div>
              
              <AccordionTrigger className='p-0 flex-grow h-auto hover:bg-transparent' isIconVisible={false}>
                  <div className='flex gap-2 truncate flex-grow text-left items-center'>
                      <FileIcon filename={fileName} type='file'/>
                      <div className='flex flex-col truncate'>
                        <span className='text-sm text-text-primary truncate'>{fileName}</span>
                        {directoryPath && (
                            <span className='font-mono text-xs text-text-secondary truncate'>{directoryPath}</span>
                        )}
                      </div>
                  </div>
              </AccordionTrigger>

              {getActionPill(fileChange.action)}

              <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                openDiff(fileChange);
                            }}
                            className='p-1.5 rounded text-text-secondary hover:bg-gray-light hover:text-text-primary'
                        >
                            <ArrowRight size={14} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>View Changes in Editor</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
          </TriggerContentWrapper>

          <AccordionContent>
            <div className='overflow-x-auto'>
               <ReactDiffViewer
                  oldValue={fileChange.original_content || ''}
                  newValue={fileChange.new_content || ''}
                  splitView={true}
                  useDarkTheme={true}
                  styles={diffViewerStyles}
                  showDiffOnly={false}
                  hideLineNumbers={false}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default React.memo(FileDiffViewer);
