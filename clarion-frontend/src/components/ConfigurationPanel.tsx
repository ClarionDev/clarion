import { X, Fingerprint, FileCode2, Bot, Variable, Beaker, Cpu } from 'lucide-react';
import { useAppStore } from '../store/store';
import Button from './ui/Button';
import { cn } from '../lib/utils';
import { CodeContextTab, CoreIdentityTab, LLMSettingsTab, OutputSchemaTab, PlaygroundTab, UserVariablesTab } from './PropertiesPanel';
import { useMemo, useState } from 'react';
import Notification from './ui/Notification';
import { fetchAgents, saveAgent } from '../lib/api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/Accordion';
import { ExcludePatternsEditor, IncludePatternsEditor, SystemPromptEditor } from './PropertiesPanel';

const ConfigurationPanel = () => {
  const {
    configPanel,
    closeConfigPanel,
    agentStateForEdit,
    setAgentStateForEdit,
    activeAgent,
    setAgents,
    setActiveAgent
  } = useAppStore();

  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(activeAgent) !== JSON.stringify(agentStateForEdit);
  }, [activeAgent, agentStateForEdit]);

  const handleCancel = () => {
    if (activeAgent) {
      setAgentStateForEdit({ ...activeAgent });
    }
  };

  const handleSaveChanges = async () => {
    if (!agentStateForEdit) return;

    const result = await saveAgent(agentStateForEdit);
    if (result.success) {
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents);
      const freshlySavedAgent = updatedAgents.find(a => a.id === agentStateForEdit.id);
      if (freshlySavedAgent) {
        setAgentStateForEdit({ ...freshlySavedAgent });
        setActiveAgent(freshlySavedAgent, true); // Update active agent without triggering another save
      }
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } else {
      console.error("Failed to save agent:", result.error);
    }
  };

  if (!configPanel.isOpen || !agentStateForEdit) {
    return null;
  }

  return (
    <div className='flex flex-col h-full bg-gray-medium/50 border-l border-gray-light'>
      <div className='flex-shrink-0 p-3 border-b border-gray-light flex justify-between items-center bg-gray-medium/80'>
        <div>
          <h2 className='text-md font-bold text-text-primary'>Configure: {agentStateForEdit.name}</h2>
          {isDirty && <span className='text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full'>Unsaved Changes</span>}
        </div>
        <Button onClick={closeConfigPanel} variant='ghost' size='icon' className='text-text-secondary h-8 w-8'>
          <X size={18} />
        </Button>
      </div>

      <div className='flex-grow overflow-y-auto p-4'>
        <Accordion type="multiple" defaultValue={configPanel.defaultOpenItems} className="w-full space-y-3">
            <AccordionItem value="system-prompt" className="border border-gray-light rounded-md bg-gray-dark/50">
                <AccordionTrigger className="p-3 text-sm">System Prompt</AccordionTrigger>
                <AccordionContent>
                  <div className='p-3 border-t border-gray-light'>
                    <SystemPromptEditor agent={agentStateForEdit} onAgentChange={setAgentStateForEdit} />
                  </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="output-schema" className="border border-gray-light rounded-md bg-gray-dark/50">
                <AccordionTrigger className="p-3 text-sm">Output Schema</AccordionTrigger>
                <AccordionContent>
                    <div className='h-[500px] border-t border-gray-light'>
                        <OutputSchemaTab agent={agentStateForEdit} onAgentChange={setAgentStateForEdit} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="include-patterns" className="border border-gray-light rounded-md bg-gray-dark/50">
                <AccordionTrigger className="p-3 text-sm">Include Patterns</AccordionTrigger>
                <AccordionContent>
                    <div className='p-3 border-t border-gray-light'>
                      <IncludePatternsEditor agent={agentStateForEdit} onAgentChange={setAgentStateForEdit} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="exclude-patterns" className="border border-gray-light rounded-md bg-gray-dark/50">
                <AccordionTrigger className="p-3 text-sm">Exclude Patterns</AccordionTrigger>
                <AccordionContent>
                    <div className='p-3 border-t border-gray-light'>
                      <ExcludePatternsEditor agent={agentStateForEdit} onAgentChange={setAgentStateForEdit} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>

      <div className='flex-shrink-0 p-3 border-t border-gray-light flex justify-end items-center gap-3 bg-gray-medium/80'>
        <Button onClick={handleCancel} variant='secondary' size='sm' disabled={!isDirty}>Cancel</Button>
        <Button onClick={handleSaveChanges} size='sm' disabled={!isDirty}>Save Changes</Button>
      </div>

      <Notification 
        show={showSaveNotification} 
        onDismiss={() => setShowSaveNotification(false)} 
        message='Agent saved successfully!' 
      />
    </div>
  );
};

export default ConfigurationPanel;
