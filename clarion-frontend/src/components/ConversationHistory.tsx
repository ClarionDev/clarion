import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/store';
import { Bot, User, Sparkles, ServerCrash } from 'lucide-react';
import Change from './Change';

const ConversationHistory = () => {
    const { runs } = useAppStore(state => ({ runs: state.runs }));
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [runs]);

    const renderRunContent = (run: (typeof runs)[0]) => {
         switch (run.status) {
            case 'running':
                return (
                <div className='flex items-center gap-4 animate-pulse p-4'>
                    <Sparkles className='w-6 h-6 text-accent-blue' />
                    <div>
                        <p className='font-semibold'>Agent is thinking...</p>
                        <p className='text-text-secondary text-sm'>Processing your request.</p>
                    </div>
                </div>
                );
            case 'error':
                return (
                <div className='flex items-center gap-4 p-4 bg-red-500/10 rounded-lg'>
                    <ServerCrash className='w-6 h-6 text-red-500' />
                    <div>
                        <p className='font-semibold'>An Error Occurred</p>
                        <p className='text-text-secondary text-sm'>{run.output?.error || 'Something went wrong.'}</p>
                    </div>
                </div>
                );
            case 'success':
                if (!run.output) return null;
                return (
                    <div className="space-y-4">
                        {run.output.summary && (
                            <div className='bg-gray-dark/50 rounded-lg p-4 w-full'>
                                <p className='whitespace-pre-wrap'>{run.output.summary}</p>
                            </div>
                        )}
                        {run.output.fileChanges && run.output.fileChanges.length > 0 && (
                           <Change run={run} />
                        )}
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div ref={scrollRef} className='flex-grow overflow-y-auto p-4'>
            {(!runs || runs.length === 0) ? (
                <div className='flex flex-col items-center justify-center h-full text-center p-4'>
                    <Sparkles className='w-12 h-12 text-gray-light mb-4' />
                    <h3 className='font-semibold text-lg'>AI Command Center</h3>
                    <p className='text-text-secondary text-sm'>Run an agent to start a conversation.</p>
                </div>
            ) : (
                <div className='space-y-8'>
                    {[...runs].reverse().map(run => (
                        <React.Fragment key={run.id}>
                            {/* User's Prompt */}
                            <div className='flex items-start gap-4'>
                                <div className='w-8 h-8 rounded-full bg-gray-light flex items-center justify-center flex-shrink-0'>
                                    <User size={18} />
                                </div>
                                <div className='bg-gray-dark/50 rounded-lg p-4 w-full'>
                                    <p className='whitespace-pre-wrap'>{run.prompt}</p>
                                </div>
                            </div>

                            {/* AI's Response */}
                             <div className='flex items-start gap-4'>
                                <div className='w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center flex-shrink-0'>
                                    <Bot size={18} />
                                </div>
                                <div className='w-full'>
                                    {renderRunContent(run)}
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ConversationHistory;
