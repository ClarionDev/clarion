import { X, FileDiffIcon } from 'lucide-react';
import { OpenFile } from '../store/store';
import { cn } from '../lib/utils';
import FileIcon from './FileIcon';

interface EditorTabsProps {
  openFiles: OpenFile[];
  activeFileId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const EditorTabs = ({ openFiles, activeFileId, onSelectTab, onCloseTab }: EditorTabsProps) => {
  if (openFiles.length === 0) {
    return (
      <div className='p-2.5 border-b border-gray-light flex justify-between items-center text-sm text-text-secondary'>
         Select a file to view its content
      </div>
    )
  }

  return (
    <div className="flex items-end border-b border-gray-light">
      {openFiles.map((file) => (
        <div
          key={file.id}
          onClick={() => onSelectTab(file.id)}
          className={cn(
            'flex items-center p-2.5 pr-1 border-r border-gray-light cursor-pointer text-sm',
            {
              'bg-gray-dark/50 text-text-primary': file.id === activeFileId,
              'text-text-secondary hover:bg-gray-light/20': file.id !== activeFileId,
            }
          )}
        >
          {file.isDiff ? <FileDiffIcon className='w-4 h-4 mr-2 flex-shrink-0 text-yellow-400' /> : <FileIcon filename={file.name} type={'file'} />}
          <span className="mr-2">{file.name}</span>
          <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                onCloseTab(file.id); 
            }}
            className='group p-1 rounded hover:bg-gray-light/50 relative w-5 h-5 flex items-center justify-center'
          >
            <X size={14} className={cn("transition-opacity", file.isDirty ? 'opacity-0 group-hover:opacity-100' : 'opacity-50 group-hover:opacity-100')} />
            {file.isDirty && <div className="absolute w-2 h-2 rounded-full bg-blue-400 transition-opacity opacity-100 group-hover:opacity-0"></div>}
          </button>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
