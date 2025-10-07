import React, { useEffect, useRef } from 'react';
import { useAppStore, AgentRun } from '../store/store';
import { Bot, User, Sparkles, ServerCrash } from 'lucide-react';
import Change from './Change';
import CopyButton from './ui/CopyButton';

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 py-3 px-4 bg-gray-medium rounded-lg rounded-tl-none">
    <div className="h-2 w-2 bg-gray-light rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-gray-light rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-gray-light rounded-full animate-bounce"></div>
  </div>
);

const UserMessage = ({ run }: { run: AgentRun }) => (
  <div className="flex flex-row-reverse items-start gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-light flex items-center justify-center">
      <User size={18} />
    </div>
    <div className="relative group bg-accent-blue/10 border border-accent-blue/20 rounded-lg rounded-tr-none p-4 max-w-3xl">
      <p className="whitespace-pre-wrap text-text-primary">{run.prompt}</p>
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton textToCopy={run.prompt} />
      </div>
    </div>
  </div>
);

const AIMessage = ({ run }: { run: AgentRun }) => {
  const renderContent = () => {
    switch (run.status) {
      case 'running':
        return <TypingIndicator />;
      case 'error':
        return (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg rounded-tl-none">
            <div className="flex items-start gap-3">
              <ServerCrash className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400">An Error Occurred</p>
                <p className="text-text-secondary text-sm mt-1">{run.output?.error || 'Something went wrong.'}</p>
              </div>
            </div>
          </div>
        );
      case 'success':
        if (!run.output) return null;
        return (
          <div className="space-y-4">
            {run.output.summary && (
              <div className="relative group bg-gray-medium rounded-lg rounded-tl-none p-4 w-full">
                <p className="whitespace-pre-wrap">{run.output.summary}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton textToCopy={run.output.summary} />
                </div>
              </div>
            )}
            {run.output.fileChanges && run.output.fileChanges.length > 0 && <Change run={run} />}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center">
        <Bot size={18} />
      </div>
      <div className="max-w-3xl">
        {renderContent()}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className='flex flex-col items-center justify-center h-full text-center p-4 text-text-secondary'>
    <div className='p-4 bg-gray-medium rounded-full border-2 border-dashed border-gray-light mb-4'>
      <Sparkles className='w-12 h-12 text-gray-light' />
    </div>
    <h3 className='font-semibold text-lg text-text-primary'>AI Command Center</h3>
    <p className='text-sm max-w-xs mt-1'>
      Select an agent, provide a prompt, and add files to the context to start your conversation.
    </p>
  </div>
);

const ConversationHistory = () => {
  const { runs } = useAppStore(state => ({ runs: state.runs }));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [runs]);

  const reversedRuns = [...runs].reverse();

  return (
    <div ref={scrollRef} className='flex-grow overflow-y-auto p-6 bg-gray-dark'>
      {(!runs || runs.length === 0) ? (
        <EmptyState />
      ) : (
        <div className='space-y-8'>
          {reversedRuns.map(run => (
            <div key={run.id} className="space-y-6 animate-in fade-in-0 duration-500">
              <UserMessage run={run} />
              <AIMessage run={run} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;
