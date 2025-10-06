import { useAppStore } from '../store/store';
import { Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

const LLMSelector = () => {
  const { activeAgent } = useAppStore();

  if (!activeAgent) {
    return null;
  }

  const llmProvider = activeAgent.llmConfig?.provider || 'Default';

  return (
    <div className={cn('flex items-center gap-2 text-sm font-medium text-text-secondary p-2 rounded-lg')}>
      <Cpu className='w-5 h-5 text-text-secondary'/>
      <span className='font-semibold text-text-primary'>{llmProvider}</span>
    </div>
  );
};

export default LLMSelector;
