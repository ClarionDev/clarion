import { useState } from 'react';
import { GitBranch, GitCommitHorizontal, Upload, Download, ChevronDown, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/store';
import Button from './ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

const GitNav = () => {
  const [currentBranch] = useState('main');
  const { runs, clearHistory } = useAppStore(state => ({ runs: state.runs, clearHistory: state.clearHistory }));

  const navItems = [
    { id: 'commit', label: 'Commit', icon: GitCommitHorizontal },
    { id: 'push', label: 'Push', icon: Upload },
    { id: 'pull', label: 'Pull', icon: Download },
  ];

  return (
    <div className="flex-shrink-0 px-4 py-2 border-b border-gray-light bg-gray-medium flex items-center justify-between h-[57px]">
      <TooltipProvider delayDuration={300}>
        <div className='flex items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className='flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-text-secondary hover:text-text-primary hover:bg-gray-light/50'>
                <GitBranch className='w-4 h-4' />
                <span className='font-semibold text-text-primary'>{currentBranch}</span>
                <ChevronDown size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch Branch</p>
            </TooltipContent>
          </Tooltip>

          <div className='w-px h-6 bg-gray-light/50' />

          {navItems.map(item => (
            <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => alert(`${item.label} functionality coming soon!`)}
                        className='p-2 rounded-md transition-colors text-text-secondary hover:text-text-primary hover:bg-gray-light/50'
                    >
                        <item.icon className='w-5 h-5' />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Button variant='ghost' size='sm' onClick={clearHistory} disabled={!runs || runs.length === 0}>
            <Trash2 size={14} className='mr-2'/> Clear Chat
        </Button>
      </TooltipProvider>
    </div>
  );
};

export default GitNav;
