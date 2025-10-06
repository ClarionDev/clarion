import { useAppStore } from '../../store/store';
import { SlidersHorizontal, X } from 'lucide-react';
import Button from '../ui/Button';
import CodeViewer from '../ui/CodeViewer';

const SystemPromptModal = () => {
  const { activeConfigSection, setActiveConfigSection, agentStateForEdit, setAgentStateForEdit, setActiveAgent } = useAppStore();

  if (activeConfigSection !== 'systemPrompt' || !agentStateForEdit) {
    return null;
  }

  const handleSave = () => {
    // Persist changes from the editing state to the active agent state
    setActiveAgent(agentStateForEdit);
    setAgentStateForEdit(null); // Clear the editing state
    setActiveConfigSection(null);
  };

  const handleCancel = () => {
    setAgentStateForEdit(null); // Discard changes
    setActiveConfigSection(null);
  };

  const handlePromptChange = (prompt: string) => {
    setAgentStateForEdit({ ...agentStateForEdit, systemPrompt: prompt });
  }

  return (
    <div 
      onClick={handleCancel}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[70vh]'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <SlidersHorizontal className='w-5 h-5 text-accent-blue' />
                <div>
                    <h2 className='font-bold text-lg'>Edit System Prompt</h2>
                    <p className='text-sm text-text-secondary'>Define the AI's core identity and instructions.</p>
                </div>
            </div>
            <button onClick={handleCancel} className='p-1.5 rounded-md hover:bg-gray-light/50'>
                <X size={18} />
            </button>
        </header>

        <main className='flex-grow p-4 overflow-y-auto'>
           <CodeViewer 
            content={agentStateForEdit.systemPrompt}
            onChange={handlePromptChange}
           />
        </main>

        <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center gap-3'>
            <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </footer>
      </div>
    </div>
  );
};

export default SystemPromptModal;