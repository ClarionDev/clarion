import { useAppStore } from '../../store/store';
import { FileCode, X, Info } from 'lucide-react';
import Button from '../ui/Button';

const CodebaseContextModal = () => {
  const { activeConfigSection, setActiveConfigSection, contextFilePaths, agentFilteredFilePaths, activeAgent } = useAppStore();

  const hasFilters = activeAgent && (activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0);
  const finalContextPaths = hasFilters ? agentFilteredFilePaths : contextFilePaths;

  if (activeConfigSection !== 'codebase') {
    return null;
  }

  const handleClose = () => {
    setActiveConfigSection(null);
  };

  return (
    <div 
      onClick={handleClose}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[70vh]'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <FileCode className='w-5 h-5 text-accent-blue' />
                <div>
                    <h2 className='font-bold text-lg'>Codebase Context ({finalContextPaths.size} files)</h2>
                    <p className='text-sm text-text-secondary'>These files will be included in the AI's context window.</p>
                </div>
            </div>
            <button onClick={handleClose} className='p-1.5 rounded-md hover:bg-gray-light/50'>
                <X size={18} />
            </button>
        </header>

        <main className='flex-grow p-4 overflow-y-auto space-y-2'>
            {hasFilters && (
              <div className='p-3 mb-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-md text-sm flex items-start gap-2'>
                  <Info size={16} className='flex-shrink-0 mt-0.5' />
                  <p>This context is automatically determined by the active agent's filters. To change it, edit the agent's Code Context settings.</p>
              </div>
            )}
            {Array.from(finalContextPaths).sort().map(path => (
                <div key={path} className='p-2 bg-gray-dark/50 rounded-md font-mono text-sm text-text-secondary border border-gray-light'>
                    {path}
                </div>
            ))}
             {finalContextPaths.size === 0 && (
                <div className='flex items-center justify-center h-full text-center text-text-secondary'>
                    <p>No files are currently in the context.</p>
                </div>
            )}
        </main>

        <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center'>
            <Button variant='secondary' onClick={handleClose}>Close</Button>
        </footer>
      </div>
    </div>
  );
};

export default CodebaseContextModal;