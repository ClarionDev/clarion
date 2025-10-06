import { useAppStore } from '../store/store';
import { Cpu, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const LLMSelector = () => {
  const { activeAgent, setActiveConfigSection, initializeAgentForEdit } = useAppStore();

  if (!activeAgent) {
    return null;
  }

  const handleOpenModal = () => {
    initializeAgentForEdit();
    setActiveConfigSection('llmSettings');
  };

  const llmProvider = activeAgent.llmConfig?.provider || 'Default';
  const modelName = activeAgent.llmConfig?.model || 'Not Set';

  return (
    <button
      onClick={handleOpenModal}
      className={cn('flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-gray-light/50')}
    >
      <Cpu className='w-5 h-5 text-text-secondary'/>
      <span className='font-semibold text-text-primary'>{llmProvider} / {modelName}</span>
      <ChevronDown size={16} />
    </button>
  );
};

export default LLMSelector;
