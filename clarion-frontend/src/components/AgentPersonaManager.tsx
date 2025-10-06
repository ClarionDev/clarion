import { useState, useMemo } from 'react';
import { Plus, Search, Bot } from 'lucide-react';
import { AgentPersona } from '../data/agent-personas';
import AgentEditor from './AgentEditor';
import AgentCard from './AgentCard';
import Button from './ui/Button';
import { useAppStore } from '../store/store';
import { saveAgent, deleteAgent, fetchAgents } from '../lib/api';

const newAgentTemplate: Omit<AgentPersona, 'id' | 'name'> = {
    description: 'A new agent persona.',
    author: 'You',
    version: '1.0.0',
    icon: 'Bot',
    systemPrompt: 'You are a helpful AI assistant.',
    codebaseFilters: {
        includeGlobs: [],
        excludeGlobs: [],
        contentRegexInclude: '',
        maxTotalFiles: 0,
    },
    outputSchema: { type: 'object', properties: { response: { type: 'string' } } },
    userVariables: [],
    llmConfig: {
        provider: 'OpenAI',
        model: 'gpt-4o',
        parameters: {
            temperature: 0.7
        }
    }
};

const AgentPersonaManager = () => {
  const { agents, setAgents } = useAppStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'edit'>('list');

  const refreshAgents = async () => {
    const updatedAgents = await fetchAgents();
    setAgents(updatedAgents);
  }

  const handleCreateAgent = async () => {
    const newAgent: AgentPersona = {
        ...newAgentTemplate,
        id: `agent-${Date.now()}`,
        name: 'New Untitled Agent',
    };
    const result = await saveAgent(newAgent);
    if (result.success) {
        await refreshAgents();
        setSelectedAgentId(newAgent.id);
        setView('edit');
    } else {
        console.error("Failed to create agent:", result.error);
    }
  }

  const handleDuplicateAgent = async (agentToDuplicate: AgentPersona) => {
     const newAgent: AgentPersona = {
        ...JSON.parse(JSON.stringify(agentToDuplicate)), // Deep copy
        id: `agent-${Date.now()}`,
        name: `${agentToDuplicate.name} - Copy`,
    };
    const result = await saveAgent(newAgent);
    if (result.success) {
        await refreshAgents();
        setSelectedAgentId(newAgent.id);
        setView('edit');
    } else {
        console.error("Failed to duplicate agent:", result.error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    const result = await deleteAgent(agentId);
    if (result.success) {
        await refreshAgents();
        setView('list');
        setSelectedAgentId(null);
    } else {
        console.error("Failed to delete agent:", result.error);
    }
  }

  const handleSelectAgent = (agentId: string) => {
      setSelectedAgentId(agentId);
      setView('edit');
  }

  const handleCloseEditor = () => {
      setView('list');
      setSelectedAgentId(null);
      refreshAgents(); // Refresh in case there were unsaved changes
  }

  const selectedAgent = agents.find(p => p.id === selectedAgentId);

  const filteredAgents = useMemo(() => {
    return agents.filter(
      (persona) =>
        persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  if (view === 'edit' && selectedAgent) {
    return (
        <AgentEditor 
            key={selectedAgent.id} 
            agent={selectedAgent} 
            onDuplicate={handleDuplicateAgent}
            onDelete={handleDeleteAgent}
            onClose={handleCloseEditor}
        />
    )
  }

  return (
    <div className='h-full w-full bg-gray-dark/30 rounded-lg overflow-hidden flex flex-col'>
      <div className="p-6 border-b border-gray-light flex-shrink-0 bg-gray-medium/30">
        <div className='flex justify-between items-start'>
            <div>
                <h2 className="text-2xl font-bold">Agent Personas</h2>
                <p className='text-text-secondary mt-1 max-w-2xl'>Create, manage, and configure your specialized AI assistants. Each agent has a unique persona, context, and output format.</p>
            </div>
            <Button onClick={handleCreateAgent}>
                <Plus size={18} className='mr-2'/> Create New Agent
            </Button>
        </div>
      </div>

      <div className='p-4 border-b border-gray-light flex justify-between items-center'>
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
                type="text" 
                placeholder="Search by name or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-dark border border-gray-light/50 rounded-md py-2 pl-9 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm"/>
        </div>
        <div>
            <p className='text-sm text-text-secondary'>{filteredAgents.length} agent(s) found</p>
        </div>
      </div>

       <div className="flex-grow overflow-y-auto p-6 bg-gray-dark/50">
            {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredAgents.map(agent => (
                        <AgentCard key={agent.id} agent={agent} onClick={handleSelectAgent} />
                    ))}
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center h-full text-text-secondary text-center rounded-lg border-2 border-dashed border-gray-light/50'>
                    <Bot size={48} className='mb-4 text-gray-light'/>
                    <h3 className='text-lg font-semibold text-text-primary'>
                      {searchTerm ? 'No Agents Match Your Search' : 'No Agents Created Yet'}
                    </h3>
                    {searchTerm ? (
                        <p className='max-w-xs mt-1'>Try adjusting your search term to find what you're looking for.</p>
                    ) : (
                        <>
                            <p className='max-w-xs mt-1'>Get started by creating your first AI agent persona.</p>
                            <Button onClick={handleCreateAgent} size="sm" className='mt-6'>
                                <Plus size={16} className='mr-2'/> Create First Agent
                            </Button>
                        </>
                    )}
                </div>
            )}
       </div>
    </div>
  );
};

export default AgentPersonaManager;
