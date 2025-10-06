import { useState, useMemo, useCallback, useEffect } from 'react';
import { AgentPersona } from '../data/agent-personas';
import Button from './ui/Button';
import { Copy, Trash2, ArrowLeft, Fingerprint, FileCode2, Bot, Variable, Beaker, Cpu } from 'lucide-react';
import { saveAgent, deleteAgent, fetchAgents } from '../lib/api';
import { useAppStore } from '../store/store';
import { CoreIdentityTab, CodeContextTab, OutputSchemaTab, UserVariablesTab, PlaygroundTab, LLMSettingsTab } from './PropertiesPanel';
import { cn } from '../lib/utils';
import Notification from './ui/Notification';

interface AgentEditorProps {
  agent: AgentPersona;
  onDuplicate: (agent: AgentPersona) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const AgentEditor = ({ agent, onDuplicate, onDelete, onClose }: AgentEditorProps) => {
  const { setAgents, agentStateForEdit, setAgentStateForEdit } = useAppStore();
  const [activeTab, setActiveTab] = useState('core');
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  useEffect(() => {
    // On mount, set the agent being edited in the global state.
    setAgentStateForEdit({ ...agent });

    // On unmount, clear the editing state.
    return () => {
      setAgentStateForEdit(null);
    };
  }, [agent, setAgentStateForEdit]);

  const isDirty = useMemo(() => {
    // Compare the original prop with the version in the global store.
    return JSON.stringify(agent) !== JSON.stringify(agentStateForEdit);
  }, [agent, agentStateForEdit]);

  const handleCancel = () => {
    setAgentStateForEdit({ ...agent }); // Reset changes by restoring from original prop
  }

  const handleSaveChanges = async () => {
    if (!agentStateForEdit) return;

    const result = await saveAgent(agentStateForEdit);
    if (result.success) {
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents);
      // Find the newly saved agent to update the local state, making the form clean
      const freshlySavedAgent = updatedAgents.find(a => a.id === agentStateForEdit.id);
      if (freshlySavedAgent) {
          // This is crucial to make the `isDirty` flag become false
          setAgentStateForEdit({ ...freshlySavedAgent });
      }
      // Trigger the notification
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } else {
      console.error("Failed to save agent:", result.error);
    }
  }

  const handleAgentChange = useCallback((changedFields: Partial<AgentPersona>) => {
    setAgentStateForEdit({ ...(agentStateForEdit as AgentPersona), ...changedFields });
  }, [agentStateForEdit, setAgentStateForEdit]);

  const tabs = [
    { id: 'core', label: 'Core Identity', icon: Fingerprint },
    { id: 'llm', label: 'LLM Settings', icon: Cpu },
    { id: 'context', label: 'Code Context', icon: FileCode2 },
    { id: 'output', label: 'Output Schema', icon: Bot },
    { id: 'variables', label: 'User Variables', icon: Variable },
    { id: 'playground', label: 'Playground', icon: Beaker },
  ];

  if (!agentStateForEdit) {
    return null; // Or a loading spinner
  }

  return (
    <div className='flex flex-col h-full bg-gray-dark/30'>
      <div className='flex-shrink-0 p-4 border-b border-gray-light flex justify-between items-center bg-gray-dark/50'>
        <div className='flex items-center gap-4'>
            <Button onClick={onClose} variant='ghost' size='icon' className='text-text-secondary'>
                <ArrowLeft size={20} />
            </Button>
            <div>
                <h2 className='text-lg font-bold text-text-primary'>{agentStateForEdit.name}</h2>
                {isDirty && <span className='text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full'>Unsaved Changes</span>}
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button onClick={() => onDuplicate(agent)} variant='ghost' size='sm'><Copy size={16} className='mr-2'/> Duplicate</Button>
            <Button onClick={() => onDelete(agent.id)} variant='destructive' size='sm'><Trash2 size={16}/> </Button>
        </div>
      </div>
      
      <div className='flex-grow overflow-hidden flex'>
        {/* Left Panel: Navigation Tabs */}
        <aside className='w-64 bg-gray-medium/50 border-r border-gray-light p-4 flex flex-col gap-2'>
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-md text-sm text-left',
                        {
                            'bg-accent-blue/20 text-accent-blue font-semibold': activeTab === tab.id,
                            'text-text-secondary hover:bg-gray-light/50 hover:text-text-primary': activeTab !== tab.id
                        }
                    )}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </aside>

        {/* Right Panel: Content (takes remaining height) */}
        <main className='flex-1 flex flex-col overflow-hidden bg-gray-dark/50'>
            <div className='flex-grow overflow-hidden'>
                {activeTab === 'core' && <CoreIdentityTab agent={agentStateForEdit} onAgentChange={handleAgentChange} />}
                {activeTab === 'llm' && <LLMSettingsTab agent={agentStateForEdit} onAgentChange={handleAgentChange} />}
                {activeTab === 'context' && <CodeContextTab agent={agentStateForEdit} onAgentChange={handleAgentChange} />}
                {activeTab === 'output' && <OutputSchemaTab agent={agentStateForEdit} onAgentChange={handleAgentChange} />}
                {activeTab === 'variables' && <UserVariablesTab agent={agentStateForEdit} onAgentChange={handleAgentChange} />}
                {activeTab === 'playground' && <PlaygroundTab agent={agentStateForEdit} />}
            </div>
        </main>
      </div>

      <div className='flex-shrink-0 p-4 border-t border-gray-light flex justify-end items-center gap-3 bg-gray-medium/50'>
            <Button onClick={handleCancel} variant='secondary' disabled={!isDirty}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={!isDirty}>Save Changes</Button>
      </div>

      <Notification 
        show={showSaveNotification} 
        onDismiss={() => setShowSaveNotification(false)} 
        message='Agent saved successfully!' 
      />
    </div>
  );
};

export default AgentEditor;
