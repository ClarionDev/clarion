import { useState, useEffect } from 'react';
import { useAppStore } from '../store/store';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { Sparkles, Files } from 'lucide-react';
import { runAgent as runAgentApi, AgentOutput as ApiAgentOutput, fetchTotalTokenCount } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { formatTokenCount } from '../lib/utils';

const PromptZone = () => {
  const [localPrompt, setLocalPrompt] = useState('');
  const debouncedPrompt = useDebounce(localPrompt, 300);
  const [tokenCount, setTokenCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);

  const {
    setPrompt,
    activeAgent,
    contextFilePaths, 
    agentFilteredFilePaths, 
    currentProject,
    startNewRun,
    updateRun,
    currentRunStatus,
    setActiveModalSection,
  } = useAppStore(state => ({
    setPrompt: state.setPrompt,
    activeAgent: state.activeAgent,
    contextFilePaths: state.contextFilePaths,
    agentFilteredFilePaths: state.agentFilteredFilePaths,
    currentProject: state.currentProject,
    startNewRun: state.startNewRun,
    updateRun: state.updateRun,
    currentRunStatus: state.currentRunStatus,
    setActiveModalSection: state.setActiveModalSection,
  }));

  const useAgentFilters = activeAgent && (activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0);
  const finalContextPaths = useAgentFilters ? agentFilteredFilePaths : contextFilePaths;

  useEffect(() => {
    setPrompt(debouncedPrompt);
  }, [debouncedPrompt, setPrompt]);

  useEffect(() => {
    if (!activeAgent || !currentProject) {
      setTokenCount(0);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const count = async () => {
      setIsCounting(true);
      const payload = {
        agent_id: activeAgent.id,
        user_prompt: debouncedPrompt,
        codebase_paths: Array.from(finalContextPaths),
        project_root: currentProject.path,
      };
      const result = await fetchTotalTokenCount(payload, signal);
      if (!signal.aborted) {
        setTokenCount(result);
        setIsCounting(false);
      }
    };

    count();

    return () => {
      controller.abort();
    };
  }, [debouncedPrompt, activeAgent, finalContextPaths, currentProject]);


  const handleRunAgent = async () => {
    if (!activeAgent || !currentProject || !localPrompt) return;

    const pathsToProcess = Array.from(finalContextPaths);
    
    const runId = startNewRun(activeAgent, localPrompt, pathsToProcess, currentProject.path);
    setLocalPrompt('');

    try {
      const result: ApiAgentOutput = await runAgentApi({
        system_instruction: activeAgent.systemPrompt,
        prompt: localPrompt,
        output_schema: activeAgent.outputSchema,
        codebase_paths: pathsToProcess,
        project_root: currentProject.path,
        llm_config: activeAgent.llmConfig,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      
      updateRun(runId, {
        status: 'success',
        output: {
          summary: result.summary || 'No summary provided.',
          fileChanges: result.file_changes || [],
          rawOutput: result,
          error: undefined,
          tokenUsage: result.token_usage,
        },
      });

    } catch (e: any) {
      updateRun(runId, {
        status: 'error',
        output: {
          summary: "An error occurred.",
          fileChanges: [],
          rawOutput: { error: e.message },
          error: e.message,
        },
      });
    }
  };

  return (
    <div className="p-4 border-t border-gray-light flex-shrink-0 flex flex-col gap-3">
      <div className='flex justify-end items-center text-xs text-text-secondary gap-4'>
        <button 
          onClick={() => setActiveModalSection('codebase')} 
          className='flex items-center gap-2 hover:text-text-primary'
        >
          <Files size={14} />
          <span>{finalContextPaths.size} files in context</span>
        </button>
        {(tokenCount > 0) && (
            <span className='text-text-secondary'>
                ({isCounting ? '...' : `${formatTokenCount(tokenCount)} tokens`})
            </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <Textarea 
          placeholder={`Prompt for ${activeAgent?.name || 'the AI'}...`}
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          rows={4}
          className='min-h-[80px] flex-grow'
        />
        <Button 
          onClick={handleRunAgent} 
          disabled={currentRunStatus === 'running' || !localPrompt || !activeAgent} 
          size="icon"
          title="Run Agent"
          className='h-10 w-10 flex-shrink-0'
        >
          {currentRunStatus === 'running' ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Sparkles size={18} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default PromptZone;
