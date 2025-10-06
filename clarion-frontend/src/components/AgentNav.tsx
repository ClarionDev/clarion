import AgentConfigBar from './AgentConfigBar';
import AgentSwitcher from './AgentSwitcher';
import { useAppStore } from '../store/store';
import Button from './ui/Button';
import { Beaker } from 'lucide-react';
import { AgentRunRequest } from '../lib/api';
import LLMSelector from './LLMSelector';

const AgentNav = () => {
  const { 
    activeAgent,
    prompt,
    currentProject,
    contextFilePaths,
    agentFilteredFilePaths,
    openSimulatorModal
  } = useAppStore();

  const handleOpenSimulator = () => {
    if (!activeAgent || !currentProject) {
      alert("Please select an agent and open a project folder before using the simulator.");
      return;
    }

    const useAgentFilters = activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0;
    const finalContextPaths = useAgentFilters ? agentFilteredFilePaths : contextFilePaths;

    const payload: AgentRunRequest = {
      system_instruction: activeAgent.systemPrompt,
      prompt: prompt,
      codebase_paths: Array.from(finalContextPaths),
      output_schema: activeAgent.outputSchema,
      project_root: currentProject.path,
      llm_config: activeAgent.llmConfig,
    };

    openSimulatorModal(payload);
  }

  return (
    <div className="flex-shrink-0 px-4 py-2 border-b border-gray-light bg-gray-medium flex items-center justify-between">
      <div className='flex items-center gap-4'>
        <AgentSwitcher />
        <div className='w-px h-6 bg-gray-light/50' />
        <LLMSelector />
        <div className='w-px h-6 bg-gray-light/50' />
        <AgentConfigBar />
      </div>
      <Button variant="ghost" size="sm" onClick={handleOpenSimulator}>
        <Beaker size={16} className="mr-2"/> Simulator
      </Button>
    </div>
  );
};

export default AgentNav;
