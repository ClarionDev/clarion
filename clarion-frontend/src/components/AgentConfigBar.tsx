import { Braces, FileCode, SlidersHorizontal } from 'lucide-react';
import { useAppStore, AgentConfigSection } from '../store/store';
import { cn } from '../lib/utils';

const AgentConfigBar = () => {
  const { activeConfigSection, setActiveConfigSection, initializeAgentForEdit } = useAppStore();

  const configItems: { id: AgentConfigSection; label: string; icon: React.ElementType }[] = [
    { id: 'systemPrompt', label: 'System Prompt', icon: SlidersHorizontal },
    { id: 'outputSchema', label: 'Output Schema', icon: Braces },
    { id: 'codebase', label: 'Codebase Context', icon: FileCode },
  ];

  const handleClick = (section: AgentConfigSection) => {
    // When opening a config modal that edits the agent, initialize the editing state.
    if (section === 'systemPrompt' || section === 'outputSchema') {
        initializeAgentForEdit();
    }
    setActiveConfigSection(section);
  }

  return (
    <div className='flex items-center gap-1 bg-gray-medium/50 border border-gray-light rounded-lg p-1'>
      {configItems.map(item => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors', {
            'bg-gray-dark text-text-primary shadow-sm': activeConfigSection === item.id,
            'text-text-secondary hover:text-text-primary hover:bg-gray-light/50': activeConfigSection !== item.id,
          })}
        >
          <item.icon className='w-4 h-4' />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AgentConfigBar;