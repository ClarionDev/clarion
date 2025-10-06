import { AgentPersona, iconMap } from '../data/agent-personas';
import { CheckCircle, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (agent: AgentPersona) => void;
  agents: AgentPersona[];
  currentAgentId: string;
}

const AgentSelectionModal = ({ isOpen, onClose, onSelect, agents, currentAgentId }: AgentSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      onClick={onClose}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0'>
            <h2 className='font-bold text-lg'>Select an Agent</h2>
            <p className='text-sm text-text-secondary'>Choose the AI persona to assist with your task.</p>
             <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input 
                    type="text" 
                    placeholder="Search agents..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-dark border border-gray-light/50 rounded-md py-2 pl-9 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm"/>
            </div>
        </header>

        <main className='p-2 max-h-[60vh] overflow-y-auto'>
            <div className='space-y-1'>
                {filteredAgents.map(agent => {
                    const Icon = iconMap[agent.icon] || iconMap.default;
                    return (
                        <button 
                            key={agent.id} 
                            onClick={() => onSelect(agent)}
                            className={cn('w-full text-left flex items-center justify-between p-3 rounded-lg transition-colors', {
                                'bg-accent-blue/10 hover:bg-accent-blue/20': agent.id === currentAgentId,
                                'hover:bg-gray-light/50': agent.id !== currentAgentId
                            })}
                        >
                            <div className='flex items-center gap-3'>
                                <Icon className='w-6 h-6 text-text-secondary flex-shrink-0' />
                                <div>
                                    <p className='font-semibold text-text-primary'>{agent.name}</p>
                                    <p className='text-xs text-text-secondary line-clamp-1'>{agent.description}</p>
                                </div>
                            </div>
                            {agent.id === currentAgentId && <CheckCircle className='w-5 h-5 text-accent-blue' />}
                        </button>
                    )
                })}
            </div>
        </main>
      </div>
    </div>
  );
};

export default AgentSelectionModal;