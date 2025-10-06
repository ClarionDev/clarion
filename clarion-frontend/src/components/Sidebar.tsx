import { FolderTree, Settings, BotMessageSquare, BrainCircuit, Store, FolderOpen, Cpu } from 'lucide-react';
import { useAppStore, ActiveView } from '../store/store';
import { cn } from '../lib/utils';
import { open } from '@tauri-apps/plugin-dialog';
import { fetchDirectoryTree } from '../lib/api';

const Sidebar = () => {
  const { activeView, setActiveView, setProjectRoot } = useAppStore();

  const handleOpenFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
      });

      if (typeof selectedPath === 'string') {
        setProjectRoot(selectedPath);
        setActiveView('file-tree');
      }
    } catch (error) {
      console.error("Failed to open folder:", error);
    }
  };

  const navItems = [
    {
      id: 'file-tree',
      label: 'File Explorer',
      icon: FolderTree,
    },
    {
      id: 'agent-persona',
      label: 'Agent Personas',
      icon: BotMessageSquare,
    },
    {
      id: 'llm-configs',
      label: 'LLM',
      icon: Cpu,
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Bases',
      icon: BrainCircuit,
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: Store,
    },
  ];

  return (
    <aside className="w-16 bg-gray-medium p-3 border-r border-gray-light flex flex-col items-center justify-between">
      <nav>
        <ul className='space-y-2'>
          <li className="group relative">
             <button
                onClick={handleOpenFolder}
                className={'p-3 rounded-lg transition-colors w-full flex justify-center text-text-secondary hover:bg-gray-light hover:text-text-primary'}
              >
                <FolderOpen className="w-6 h-6" />
              </button>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap bg-gray-dark border border-gray-light text-text-primary shadow-lg transition-all scale-0 opacity-0 origin-left group-hover:scale-100 group-hover:opacity-100 z-50">
                Open Folder
              </span>
          </li>
           <div className='h-px w-full bg-gray-light/50 my-2'></div>
          {navItems.map((item) => (
            <li key={item.id} className="group relative">
              <button
                onClick={() => setActiveView(item.id as ActiveView)}
                className={cn(
                  'p-3 rounded-lg transition-colors w-full flex justify-center',
                  'text-text-secondary hover:bg-gray-light hover:text-text-primary',
                  { 'bg-accent-blue/20 text-accent-blue': activeView === item.id }
                )}
              >
                <item.icon className="w-6 h-6" />
              </button>
              <span
                className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap bg-gray-dark border border-gray-light text-text-primary shadow-lg transition-all scale-0 opacity-0 origin-left group-hover:scale-100 group-hover:opacity-100 z-50"
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
      <div className="group relative">
         <button className="p-3 rounded-lg text-text-secondary hover:bg-gray-light hover:text-text-primary transition-colors">
            <Settings className="w-6 h-6" />
         </button>
         <span 
            className="absolute left-full bottom-2 ml-4 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap bg-gray-dark border border-gray-light text-text-primary shadow-lg transition-all scale-0 opacity-0 origin-left group-hover:scale-100 group-hover:opacity-100"
          >
            Settings
          </span>
      </div>
    </aside>
  );
};

export default Sidebar;
