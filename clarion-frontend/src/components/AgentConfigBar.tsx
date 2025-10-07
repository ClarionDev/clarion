import { Braces, FileCode, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../store/store';
import { cn } from '../lib/utils';

const AgentConfigBar = () => {
  const { configPanel, openConfigPanel } = useAppStore();

  const configItems = [
    { id: 'system-prompt', label: 'System Prompt', icon: SlidersHorizontal, action: () => openConfigPanel(['system-prompt']) },
    { id: 'output-schema', label: 'Output Schema', icon: Braces, action: () => openConfigPanel(['output-schema']) },
    { id: 'codebase-context', label: 'Codebase Context', icon: FileCode, action: () => openConfigPanel(['include-patterns', 'exclude-patterns']) },
  ];

  const isItemActive = (id: string) => {
    if (!configPanel.isOpen) return false;
    if (id === 'codebase-context') {
      return configPanel.defaultOpenItems.includes('include-patterns') || configPanel.defaultOpenItems.includes('exclude-patterns');
    }
    return configPanel.defaultOpenItems.includes(id);
  }

  return (
    <div className='flex items-center gap-1 bg-gray-medium/50 border border-gray-light rounded-lg p-1'>
      {configItems.map(item => (
        <button
          key={item.id}
          onClick={item.action}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors', {
            'bg-gray-dark text-text-primary shadow-sm': isItemActive(item.id),
            'text-text-secondary hover:text-text-primary hover:bg-gray-light/50': !isItemActive(item.id),
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
