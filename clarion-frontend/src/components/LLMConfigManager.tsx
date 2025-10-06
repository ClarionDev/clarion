import { useState } from 'react';
import { LLMProviderConfig, LLM_PROVIDERS } from '../data/llm-configs';
import Button from './ui/Button';
import { Plus, X, KeyRound, Trash2 } from 'lucide-react';
import Input from './ui/Input';
import Label from './ui/Label';
import { useAppStore } from '../store/store';
import { saveLLMConfig, deleteLLMConfig } from '../lib/api';

export const LLMConfigManager = () => {
  const { llmProviderConfigs, loadInitialData } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<LLMProviderConfig> | null>(null);

  const handleAddNew = () => {
    setEditingConfig({});
    setIsModalOpen(true);
  };

  const handleEdit = (config: LLMProviderConfig) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteLLMConfig(id);
    await loadInitialData();
  };

  const handleSave = async () => {
    if (!editingConfig || !editingConfig.provider || !editingConfig.apiKey || !editingConfig.name) return;

    const configToSave: LLMProviderConfig = editingConfig.id
      ? (editingConfig as LLMProviderConfig)
      : { ...editingConfig, id: `llm-config-${Date.now()}` } as LLMProviderConfig;

    await saveLLMConfig(configToSave);
    await loadInitialData();

    setIsModalOpen(false);
    setEditingConfig(null);
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return '********';
    return `${key.slice(0, 5)}...${key.slice(-4)}`;
  }

  return (
    <div className='h-full w-full bg-gray-dark/30 rounded-lg overflow-hidden flex flex-col'>
      <div className="p-6 border-b border-gray-light flex-shrink-0 bg-gray-medium/30">
        <div className='flex justify-between items-start'>
            <div>
                <h2 className="text-2xl font-bold">LLM Configurations</h2>
                <p className='text-text-secondary mt-1 max-w-2xl'>Manage your API keys for different Large Language Model providers.</p>
            </div>
            <Button onClick={handleAddNew}>
                <Plus size={18} className='mr-2'/> Add New Configuration
            </Button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 bg-gray-dark/50">
        {llmProviderConfigs && llmProviderConfigs.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
                {llmProviderConfigs.map(config => (
                    <div key={config.id} className="bg-gray-medium/50 border border-gray-light rounded-lg p-4 flex items-center justify-between">
                        <div className='flex items-center gap-4'>
                            <KeyRound className='w-6 h-6 text-accent-blue' />
                            <div>
                                <h3 className='font-semibold text-text-primary'>{config.name}</h3>
                                <p className='text-sm text-text-secondary font-mono'>{config.provider} - {maskApiKey(config.apiKey)}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button variant='secondary' size='sm' onClick={() => handleEdit(config)}>Edit</Button>
                            <Button variant='destructive' size='sm' onClick={() => handleDelete(config.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className='flex flex-col items-center justify-center h-full text-text-secondary text-center rounded-lg border-2 border-dashed border-gray-light/50'>
                <KeyRound size={48} className='mb-4 text-gray-light'/>
                <h3 className='text-lg font-semibold text-text-primary'>No Configurations Added</h3>
                <p className='max-w-xs mt-1'>Add your first LLM provider API key to get started.</p>
                <Button onClick={handleAddNew} size="sm" className='mt-6'>
                    <Plus size={16} className='mr-2'/> Add Configuration
                </Button>
            </div>
        )}
      </div>

      {isModalOpen && (
          <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0' onClick={() => setIsModalOpen(false)}>
              <div className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95' onClick={e => e.stopPropagation()}>
                  <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
                      <h2 className='font-bold text-lg'>{editingConfig?.id ? 'Edit' : 'Add'} LLM Configuration</h2>
                      <button onClick={() => setIsModalOpen(false)} className='p-1.5 rounded-md hover:bg-gray-light/50'><X size={18} /></button>
                  </header>
                  <main className='p-6 space-y-4'>
                        <div>
                          <Label htmlFor='configName'>Configuration Name</Label>
                          <Input 
                            id='configName' 
                            type='text' 
                            value={editingConfig?.name || ''}
                            onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })}
                            placeholder='e.g. My OpenAI Key'
                           />
                      </div>
                      <div>
                          <Label htmlFor='provider'>LLM Provider</Label>
                          <select 
                            id='provider'
                            value={editingConfig?.provider || ''}
                            onChange={e => setEditingConfig({ ...editingConfig, provider: e.target.value as LLMProviderConfig['provider'] })}
                            className='w-full bg-gray-dark border border-gray-light rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm'
                          >
                            <option value="" disabled>Select a provider</option>
                            {LLM_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                      <div>
                          <Label htmlFor='apiKey'>API Key</Label>
                          <Input 
                            id='apiKey' 
                            type='password' 
                            value={editingConfig?.apiKey || ''}
                            onChange={e => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                           />
                      </div>
                  </main>
                  <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center gap-3'>
                      <Button variant='secondary' onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleSave}>Save</Button>
                  </footer>
              </div>
          </div>
      )}
    </div>
  );}
