import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store/store';
import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { cn } from '../lib/utils';

const Terminal = () => {
  const {
    currentProject,
    terminalSessions,
    activeTerminalId,
    setActiveTerminalId,
    addTerminalSession,
    closeTerminalSession,
    executeTerminalCommand,
    clearTerminalHistory,
  } = useAppStore();

  const activeSession = terminalSessions.find(s => s.id === activeTerminalId);
  const isCommandRunning = activeSession?.history.some(h => h.isRunning) ?? false;

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projectName = currentProject?.name || '~';

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeSession?.history]);

  useEffect(() => {
    if (!isCommandRunning) {
      inputRef.current?.focus();
    }
  }, [isCommandRunning, activeTerminalId]);

  useEffect(() => {
    setInput('');
    setHistoryIndex(-1);
  }, [activeTerminalId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!activeSession) return;

    if (e.key === 'Enter' && input.trim() && !isCommandRunning) {
      executeTerminalCommand(input);
      setHistoryIndex(-1);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < activeSession.commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(activeSession.commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(activeSession.commandHistory[newIndex]);
      } else if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const Prompt = () => (
    <div className='flex items-center gap-2 flex-shrink-0'>
      <span className='text-accent-blue'>{projectName}</span>
      <span className='text-green-400'>~</span>
      <ChevronRight size={16} className='text-text-secondary' />
      <span className='text-text-secondary'>$</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#1e1e1e] text-[#f0f0f0] flex flex-col font-mono text-sm" onClick={() => inputRef.current?.focus()}>
      <div className="flex-shrink-0 px-2 pt-2 border-b border-gray-light flex justify-between items-center bg-gray-medium">
        <div className='flex items-end gap-1 flex-grow overflow-x-auto'>
          {terminalSessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveTerminalId(session.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-t-md cursor-pointer border-b-2',
                {
                  'bg-[#1e1e1e] border-accent-blue text-text-primary': session.id === activeTerminalId,
                  'bg-gray-medium border-transparent text-text-secondary hover:bg-gray-light/50': session.id !== activeTerminalId
                }
              )}
            >
              <span className='text-xs whitespace-nowrap'>{session.name}</span>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  closeTerminalSession(session.id); 
                }}
                className='p-0.5 rounded hover:bg-gray-light/80'
              >
                <X size={14} />
              </button>
            </div>
          ))}
           <button onClick={addTerminalSession} className='p-2 mb-1 text-text-secondary hover:bg-gray-light/50 rounded' title="New Terminal">
            <Plus size={16} />
          </button>
        </div>
        <div className='flex items-center gap-1 text-text-secondary pb-1'>
          <button onClick={() => activeSession && clearTerminalHistory()} className='p-1.5 hover:bg-gray-light/50 rounded' title="Clear Terminal">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto" >
        {activeSession?.history.map((entry) => (
          <div key={entry.id}>
            <div className='flex items-center gap-2'>
              <Prompt />
              <span className='ml-2'>{entry.command}</span>
            </div>
            <pre className={cn("whitespace-pre-wrap", { 'text-red-400': entry.isError })}>
              {entry.output}
            </pre>
          </div>
        ))}

        {!isCommandRunning && (
            <div className='flex items-center gap-2'>
                <Prompt />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent focus:outline-none flex-grow ml-2"
                    autoFocus
                    spellCheck="false"
                />
            </div>
        )}
        <div ref={endOfHistoryRef} />
      </div>
    </div>
  );
};

export default Terminal;
