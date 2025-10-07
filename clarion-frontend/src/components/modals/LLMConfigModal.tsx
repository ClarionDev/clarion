import { useAppStore } from '../../store/store';
import { AgentPersona } from '../../data/agent-personas';
import { Cpu, X } from 'lucide-react';
import Button from '../ui/Button';
import Label from '../ui/Label';
import Input from '../ui/Input';
import { saveAgent, fetchAgents } from '../../lib/api';

const LLMConfigModal = () => {
  const {
    activeModalSection,
    setActiveModalSection,
    agentStateForEdit,
    setAgentStateForEdit,
    setActiveAgent,
    setAgents,
    llmProviderConfigs,
  } = useAppStore();

  if (activeModalSection !== 'llmSettings' || !agentStateForEdit) {
    return null;
  }
  
  const handleSave = async () => {
    if (!agentStateForEdit) return;

    const result = await saveAgent(agentStateForEdit);
    if (result.success) {
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents);

      const updatedActiveAgent = updatedAgents.find(a => a.id === agentStateForEdit.id);
      if (updatedActiveAgent) {
        setActiveAgent(updatedActiveAgent);
      }
      
      setAgentStateForEdit(null);
      setActiveModalSection(null);
    } else {
      console.error("Failed to save agent via modal:", result.error);
    }
  };

  const handleCancel = () => {
    setAgentStateForEdit(null);
    setActiveModalSection(null);
  };

  const onAgentChange = (changedFields: Partial<AgentPersona>) => {
    if (agentStateForEdit) {
        setAgentStateForEdit({ ...agentStateForEdit, ...changedFields });
    }
  }

  const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const configId = e.target.value;
    const selectedConfig = llmProviderConfigs.find(c => c.id === configId);
    if (selectedConfig && agentStateForEdit) {
        onAgentChange({ 
            llmConfig: { 
                ...(agentStateForEdit.llmConfig || { provider: '', model: '', parameters: {} }),
                configId: selectedConfig.id, 
                provider: selectedConfig.provider 
            }
        });
    }
  };

  const handleParamChange = (paramName: string, value: string | number) => {
    if (!agentStateForEdit) return;
    onAgentChange({
        llmConfig: {
            ...agentStateForEdit.llmConfig,
            parameters: {
                ...agentStateForEdit.llmConfig.parameters,
                [paramName]: value,
            }
        }
    });
  }

  const params = agentStateForEdit.llmConfig?.parameters || {};

  return (
    <div 
      onClick={handleCancel}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <Cpu className='w-5 h-5 text-accent-blue' />
                <div>
                    <h2 className='font-bold text-lg'>LLM Settings</h2>
                    <p className='text-sm text-text-secondary'>Configure the agent's language model and parameters.</p>
                </div>
            </div>
            <button onClick={handleCancel} className='p-1.5 rounded-md hover:bg-gray-light/50'>
                <X size={18} />
            </button>
        </header>

        <main className='p-6 space-y-6 overflow-y-auto max-h-[70vh]'>
            <div>
                <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <Label htmlFor='llmConfigId'>API Key Configuration</Label>
                        <select 
                            id='llmConfigId' 
                            value={agentStateForEdit.llmConfig?.configId || ''} 
                            onChange={handleConfigChange}
                            className='w-full bg-gray-dark border border-gray-light rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm'
                        >
                            <option value="" disabled>Select a pre-saved configuration</option>
                            {(llmProviderConfigs || []).map(config => (
                                <option key={config.id} value={config.id}>{config.name} ({config.provider})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor='llmModel'>Model Name</Label>
                        <Input 
                            id='llmModel' 
                            value={agentStateForEdit.llmConfig?.model || ''} 
                            onChange={e => onAgentChange({ llmConfig: { ...(agentStateForEdit.llmConfig), model: e.target.value }})}
                            placeholder='e.g., gpt-4o'
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Generation Parameters</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <Label htmlFor='llmTemperature'>Temperature</Label>
                        <Input 
                            id='llmTemperature' 
                            type='number'
                            step='0.1'
                            min='0'
                            max='2'
                            value={params.temperature ?? 1.0} 
                            onChange={e => handleParamChange('temperature', parseFloat(e.target.value))}
                        />
                    </div>
                     <div>
                        <Label htmlFor='llmTopP'>Top P</Label>
                        <Input 
                            id='llmTopP' 
                            type='number'
                            step='0.1'
                            min='0'
                            max='1'
                            value={params.top_p ?? 1.0} 
                            onChange={e => handleParamChange('top_p', parseFloat(e.target.value))}
                        />
                    </div>
                     <div>
                        <Label htmlFor='llmMaxTokens'>Max Output Tokens</Label>
                        <Input 
                            id='llmMaxTokens' 
                            type='number'
                            step='1'
                            min='0'
                            placeholder='(default)'
                            value={params.max_output_tokens ?? ''} 
                            onChange={e => handleParamChange('max_output_tokens', parseInt(e.target.value, 10))}
                        />
                    </div>
                </div>
                 <p className='text-xs text-text-secondary mt-4'>We recommend altering Temperature or Top P, but not both.</p>
            </div>
        </main>

        <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center gap-3'>
            <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </footer>
      </div>
    </div>
  );
};

export default LLMConfigModal;
