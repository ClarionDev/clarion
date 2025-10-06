import { useState } from 'react';
import { AgentPersona, iconMap } from '../data/agent-personas';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/store';
import AgentSelectionModal from './AgentSelectionModal';

const AgentSwitcher = () => {
  const { agents, activeAgent, setActiveAgent } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectAgent = (agent: AgentPersona) => {
    setActiveAgent(agent);
    setIsModalOpen(false);
  };

  if (!activeAgent) {
    return (
        <button 
          onClick={() => setIsModalOpen(true)}
          className='p-2 rounded-lg text-sm font-medium bg-gray-light/50 hover:bg-gray-light/80 text-text-secondary hover:text-text-primary transition-colors'>
          Select an Agent
        </button>
    );
  }
  
  const Icon = iconMap[activeAgent.icon] || iconMap.default;

  return (
    <div className="relative">
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn('flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-gray-light/50')}
      >
        <Icon className='w-5 h-5 text-accent-blue'/>
        <span className='font-semibold text-text-primary'>{activeAgent.name}</span>
        <ChevronDown size={16} />
      </button>

      <AgentSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectAgent}
        agents={agents}
        currentAgentId={activeAgent.id}
      />
    </div>
  );
};

export default AgentSwitcher;