import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { TreeNodeData } from '../data/file-tree';
import { AgentPersona } from '../data/agent-personas';
import { 
    AgentRunRequest, 
    FileChange, 
    fetchDirectoryTree, 
    fetchFileContent, 
    fetchAgents, 
    fetchLLMConfigs,
    createFile as apiCreateFile,
    deleteFile as apiDeleteFile,
    copyFile as apiCopyFile,
    writeFileContent
} from '../lib/api';
import { LLMProviderConfig } from "../data/llm-configs";

export type ActiveView = 'file-tree' | 'agent-persona' | 'knowledge-base' | 'marketplace' | 'canvas-editor' | 'llm-configs';
export type AgentStatus = 'idle' | 'running' | 'success' | 'error';
export type AgentConfigSection = 'systemPrompt' | 'outputSchema' | 'codebase' | null;

export interface OpenFile extends TreeNodeData {
    isDiff?: boolean;
    originalContent?: string;
    isDirty?: boolean;
}

let fileWatcherSocket: WebSocket | null = null;

const getAllFilePaths = (node: TreeNodeData): string[] => {
  if (node.type === 'file') {
    return [node.path];
  }
  if (node.children) {
    return node.children.flatMap(getAllFilePaths);
  }
  return [];
};

export interface AgentOutput {
  summary: string;
  fileChanges: FileChange[];
  rawOutput: Record<string, any>;
  error?: string;
}

export interface AgentRun {
  id: string;
  prompt: string;
  agentName: string;
  status: AgentStatus;
  output: AgentOutput;
  rawRequest: AgentRunRequest;
}

export interface TerminalEntry {
  id: number;
  command: string;
  output: string;
  isError: boolean;
  isRunning: boolean;
}

export interface TerminalSession {
    id: string;
    name: string;
    history: TerminalEntry[];
    commandHistory: string[];
}

interface AppState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  projectRoot: string | null;
  setProjectRoot: (path: string | null) => void;
  fileTree: TreeNodeData[];
  setFileTree: (data: TreeNodeData[]) => void;
  refreshFileTree: () => Promise<void>;
  refreshOpenFileContent: (path: string) => Promise<void>;

  contextFilePaths: Set<string>;
  agentFilteredFilePaths: Set<string>;
  setAgentFilteredFilePaths: (paths: Set<string>) => void;
  toggleFileForContext: (node: TreeNodeData) => void;
  removeFileFromContext: (path: string) => void;
  
  openFiles: OpenFile[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  openFile: (node: TreeNodeData) => void;
  updateOpenFileContent: (id: string, content: string) => void;
  saveActiveFile: () => Promise<void>;
  openDiff: (fileChange: FileChange) => void;
  closeFile: (id: string) => void;

  runs: AgentRun[];
  selectedRunId: string | null;
  currentRunStatus: AgentStatus;
  prompt: string;
  selectedFileChanges: Map<string, Set<string>>; // runId -> Set<filePath>
  appliedFileChanges: Map<string, Set<string>>; // runId -> Set<filePath> of applied changes

  startNewRun: (agent: AgentPersona, prompt: string, codebasePaths: string[], projectRoot: string) => string;
  updateRun: (id: string, data: Partial<Omit<AgentRun, 'id'>>) => void;
  createRunFromSimulatorOutput: (request: AgentRunRequest, simulatedOutput: object) => void;
  setSelectedRunId: (id: string | null) => void;
  setPrompt: (prompt: string) => void;
  clearHistory: () => void;
  toggleFileChangeSelection: (runId: string, filePath: string) => void;
  toggleAllFileChangeSelections: (runId: string, filePaths: string[], selectAll: boolean) => void;
  clearSelectedChangesForRun: (runId: string) => void;
  markChangesAsApplied: (runId: string, appliedPaths: string[]) => void;

  agents: AgentPersona[];
  setAgents: (agents: AgentPersona[]) => void;
  activeAgent: AgentPersona | null;
  setActiveAgent: (agent: AgentPersona | null) => void;
  agentStateForEdit: AgentPersona | null;
  setAgentStateForEdit: (agent: AgentPersona | null) => void;
  initializeAgentForEdit: () => void;
  activeConfigSection: AgentConfigSection;
  setActiveConfigSection: (section: AgentConfigSection) => void;

  isSimulatorModalOpen: boolean;
  simulatorRequestPayload: AgentRunRequest | null;
  openSimulatorModal: (payload: AgentRunRequest) => void;
  closeSimulatorModal: () => void;

  terminalSessions: TerminalSession[];
  activeTerminalId: string | null;
  addTerminalSession: () => void;
  closeTerminalSession: (sessionId: string) => void;
  setActiveTerminalId: (sessionId: string) => void;
  executeTerminalCommand: (command: string) => Promise<void>;
  clearTerminalHistory: () => void;
  addCommandToSessionHistory: (command: string) => void;

  llmProviderConfigs: LLMProviderConfig[];
  setLLMProviderConfigs: (configs: LLMProviderConfig[]) => void;
  loadInitialData: () => Promise<void>;

  clipboard: { path: string; name: string; type: 'file' | 'folder' } | null;
  setClipboard: (data: { path: string; name: string; type: 'file' | 'folder' } | null) => void;
  createFile: (path: string) => Promise<void>;
  deleteNode: (node: TreeNodeData) => Promise<void>;
  pasteNode: (destinationDir: string) => Promise<void>;
}

const initialSessionId = `terminal-${Date.now()}`;
const terminalSockets = new Map<string, WebSocket>();

const setupFileWatcher = (path: string | null, store: { getState: () => AppState }) => {
  if (fileWatcherSocket) {
    fileWatcherSocket.close();
    fileWatcherSocket = null;
  }

  if (!path) {
    return;
  }

  fileWatcherSocket = new WebSocket('ws://localhost:2077/api/v2/fs/watch');

  fileWatcherSocket.onopen = () => {
    console.log('File watcher connection established.');
    fileWatcherSocket?.send(JSON.stringify({ path }));
  };

  fileWatcherSocket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.event === 'change') {
            console.log(`File change detected: ${data.path}, op: ${data.op}`);
            const { getState } = store;
            const state = getState();
            
            state.refreshFileTree();

            const changedFileIsOpen = state.openFiles.some(file => file.path === data.path);
            if (changedFileIsOpen && data.op !== 'REMOVE') {
              state.refreshOpenFileContent(data.path);
            }
        }
    } catch (e) {
        console.error("Error parsing file watcher message:", e);
    }
  };

  fileWatcherSocket.onerror = (error) => {
    console.error('File watcher WebSocket error:', error);
  };

  fileWatcherSocket.onclose = () => {
    console.log('File watcher connection closed.');
    fileWatcherSocket = null;
  };
};

export const useAppStore = createWithEqualityFn<AppState>((set, get) => ({
  activeView: 'file-tree',
  setActiveView: (view) => set({ activeView: view }),
  projectRoot: null, 
  setProjectRoot: (path) => {
    set({ projectRoot: path, fileTree: [], openFiles: [], activeFileId: null, contextFilePaths: new Set() });
    setupFileWatcher(path, { getState: get });
    if (path) {
      get().refreshFileTree();
    }
  },
  fileTree: [],
  setFileTree: (data) => set({ fileTree: data }),
  refreshFileTree: async () => {
    const { projectRoot } = get();
    if (projectRoot) {
      const newTree = await fetchDirectoryTree(projectRoot);
      set({ fileTree: newTree });
    }
  },

  refreshOpenFileContent: async (path: string) => {
    const { projectRoot, openFiles } = get();
    const fileToRefresh = openFiles.find(f => f.path === path);

    if (projectRoot && fileToRefresh) {
      const fullPath = `${projectRoot}/${path}`;
      const content = await fetchFileContent(fullPath);
      set(state => ({
        openFiles: state.openFiles.map(f => 
          f.path === path ? { ...f, content, isDirty: false } : f
        )
      }));
    }
  },

  contextFilePaths: new Set(),
  agentFilteredFilePaths: new Set(),
  setAgentFilteredFilePaths: (paths) => set({ agentFilteredFilePaths: paths }),
  toggleFileForContext: (node: TreeNodeData) => set(state => {
    const newPaths = new Set(state.contextFilePaths);
    const pathsToToggle = getAllFilePaths(node);
    const allSelected = pathsToToggle.length > 0 && pathsToToggle.every(path => newPaths.has(path));

    if (allSelected) {
      pathsToToggle.forEach(path => newPaths.delete(path));
    } else {
      pathsToToggle.forEach(path => newPaths.add(path));
    }
    
    return { contextFilePaths: newPaths };
  }),

  removeFileFromContext: (path: string) => set(state => {
    const newPaths = new Set(state.contextFilePaths);
    newPaths.delete(path);
    return { contextFilePaths: newPaths };
  }),

  openFiles: [],
  activeFileId: null,
  setActiveFileId: (id) => set({ activeFileId: id }),

  openFile: async (node) => {
    if (node.type === 'folder') return;

    const { openFiles, projectRoot } = get();
    if (openFiles.some(f => f.id === node.id)) {
      set({ activeFileId: node.id });
      return;
    }

    const newOpenFile: OpenFile = { ...node, content: 'Loading...', isDirty: false };
    set(state => ({ 
      openFiles: [...state.openFiles, newOpenFile],
      activeFileId: node.id
    }));

    if (projectRoot) {
        const fullPath = `${projectRoot}/${node.path}`;
        const content = await fetchFileContent(fullPath);
        set(state => ({
            openFiles: state.openFiles.map(f => f.id === node.id ? { ...f, content } : f)
        }));
    }
  },

  updateOpenFileContent: (id, content) => set(state => ({
    openFiles: state.openFiles.map(file => 
        file.id === id ? { ...file, content, isDirty: true } : file
    )
  })),

  saveActiveFile: async () => {
    const { activeFileId, openFiles, projectRoot } = get();
    if (!activeFileId || !projectRoot) return;

    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile || !activeFile.isDirty || activeFile.isDiff) return;

    const result = await writeFileContent(projectRoot, activeFile.path, activeFile.content || '');

    if (result.success) {
        set(state => ({
            openFiles: state.openFiles.map(file => 
                file.id === activeFileId ? { ...file, isDirty: false } : file
            )
        }));
    } else {
        console.error("Failed to save file:", result.error);
        alert(`Failed to save file: ${result.error}`);
    }
  },

  openDiff: (fileChange) => {
    const { openFiles } = get();
    const diffId = `diff:${fileChange.path}`;

    if (openFiles.some(f => f.id === diffId)) {
      set({ activeFileId: diffId });
      return;
    }

    const newDiffFile: OpenFile = {
        id: diffId,
        name: `${fileChange.path} (Changes)`,
        path: fileChange.path,
        type: 'file',
        isDiff: true,
        originalContent: fileChange.original_content,
        content: fileChange.new_content,
    };

    set(state => ({
        openFiles: [...state.openFiles, newDiffFile],
        activeFileId: diffId,
    }));
  },

  closeFile: (id) => set(state => {
    const newOpenFiles = state.openFiles.filter(file => file.id !== id);
    let newActiveFileId = state.activeFileId;

    if (state.activeFileId === id) {
        if (newOpenFiles.length > 0) {
            newActiveFileId = newOpenFiles[newOpenFiles.length - 1].id;
        } else {
            newActiveFileId = null;
        }
    }
    return { openFiles: newOpenFiles, activeFileId: newActiveFileId };
  }),

  runs: [],
  selectedRunId: null,
  currentRunStatus: 'idle',
  prompt: '',
  selectedFileChanges: new Map(),
  appliedFileChanges: new Map(),

  startNewRun: (agent, prompt, codebasePaths, projectRoot) => {
    const newRunId = `run-${Date.now()}`;
    const rawRequest: AgentRunRequest = {
      system_instruction: agent.systemPrompt,
      prompt: prompt,
      output_schema: agent.outputSchema,
      codebase_paths: codebasePaths,
      project_root: projectRoot,
      llm_config: agent.llmConfig,
    };

    const newRun: AgentRun = {
      id: newRunId,
      prompt,
      agentName: agent.name,
      status: 'running',
      output: { summary: '', fileChanges: [], rawOutput: {} },
      rawRequest,
    };

    set(state => ({
      runs: [newRun, ...state.runs],
      currentRunStatus: 'running',
      selectedRunId: newRunId,
      prompt: '',
    }));

    return newRunId;
  },
  
  updateRun: (id, data) => set(state => {
    const newRuns = state.runs.map(run => {
      if (run.id === id) {
        const updatedRun = { ...run, ...data };
        if (data.output?.fileChanges) {
          updatedRun.output.fileChanges = data.output.fileChanges.map((fc, index) => ({
            ...fc,
            id: `${id}-change-${index}`,
          }));
        }
        return updatedRun;
      }
      return run;
    });

    const newState: Partial<Pick<AppState, 'runs' | 'currentRunStatus' | 'selectedFileChanges'>> = { runs: newRuns };
    
    if (state.selectedRunId === id && state.currentRunStatus === 'running' && data.status && data.status !== 'running') {
        newState.currentRunStatus = 'idle';
    }

    if (data.status === 'success' && data.output?.fileChanges) {
      const newSelectedChanges = new Map(state.selectedFileChanges);
      const allFilePaths = new Set(data.output.fileChanges.map(fc => fc.path));
      newSelectedChanges.set(id, allFilePaths);
      newState.selectedFileChanges = newSelectedChanges;
    }

    return newState;
  }),

  createRunFromSimulatorOutput: (request, simulatedOutput) => {
    const newRunId = `run-sim-${Date.now()}`;
    const outputJson = simulatedOutput as any;

    const newRun: AgentRun = {
      id: newRunId,
      prompt: request.prompt,
      agentName: 'Simulator',
      status: 'success',
      rawRequest: request,
      output: {
        summary: outputJson.summary || 'No summary provided in simulated output.',
        fileChanges: (outputJson.file_changes || []).map((fc: FileChange, index: number) => ({
          ...fc,
          id: `${newRunId}-change-${index}`
        })),
        rawOutput: outputJson,
      }
    };

    set(state => {
        const newState: Partial<Pick<AppState, 'runs' | 'selectedRunId' | 'selectedFileChanges'>> = {
            runs: [newRun, ...state.runs],
            selectedRunId: newRunId,
        };
        if (newRun.output?.fileChanges) {
            const newSelectedChanges = new Map(state.selectedFileChanges);
            const allFilePaths = new Set(newRun.output.fileChanges.map(fc => fc.path));
            newSelectedChanges.set(newRunId, allFilePaths);
            newState.selectedFileChanges = newSelectedChanges;
        }
        return newState;
    });
  },
  
  setSelectedRunId: (id) => set({ selectedRunId: id }),
  setPrompt: (prompt) => set({ prompt }),
  clearHistory: () => set({ runs: [], selectedRunId: null, selectedFileChanges: new Map(), appliedFileChanges: new Map() }),

  toggleFileChangeSelection: (runId, filePath) => set(state => {
    const newMap = new Map(state.selectedFileChanges);
    const currentSet = new Set(newMap.get(runId) || []);
    if (currentSet.has(filePath)) {
      currentSet.delete(filePath);
    } else {
      currentSet.add(filePath);
    }
    newMap.set(runId, currentSet);
    return { selectedFileChanges: newMap };
  }),

  toggleAllFileChangeSelections: (runId, filePaths, selectAll) => set(state => {
    const newMap = new Map(state.selectedFileChanges);
    const currentSet = new Set(newMap.get(runId) || []);
    if (selectAll) {
      filePaths.forEach(path => currentSet.add(path));
    } else {
      filePaths.forEach(path => currentSet.delete(path));
    }
    newMap.set(runId, currentSet);
    return { selectedFileChanges: newMap };
  }),

  clearSelectedChangesForRun: (runId: string) => set(state => {
    const newMap = new Map(state.selectedFileChanges);
    newMap.delete(runId);
    return { selectedFileChanges: newMap };
  }),

  markChangesAsApplied: (runId: string, appliedPaths: string[]) => set(state => {
    const newAppliedMap = new Map(state.appliedFileChanges);
    const currentAppliedSet = new Set(newAppliedMap.get(runId) || []);
    appliedPaths.forEach(path => currentAppliedSet.add(path));
    newAppliedMap.set(runId, currentAppliedSet);

    const newSelectedMap = new Map(state.selectedFileChanges);
    const currentSelectedSet = new Set(newSelectedMap.get(runId) || []);
    appliedPaths.forEach(path => currentSelectedSet.delete(path));
    newSelectedMap.set(runId, currentSelectedSet);

    return { appliedFileChanges: newAppliedMap, selectedFileChanges: newSelectedMap };
  }),

  agents: [],
  setAgents: (agents) => set({ agents }),
  activeAgent: null, 
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  agentStateForEdit: null,
  setAgentStateForEdit: (agent) => set({ agentStateForEdit: agent }),
  initializeAgentForEdit: () => {
    const { activeAgent } = get();
    if (activeAgent) {
      set({ agentStateForEdit: JSON.parse(JSON.stringify(activeAgent)) });
    }
  },
  activeConfigSection: null,
  setActiveConfigSection: (section) => set({ activeConfigSection: section }),

  isSimulatorModalOpen: false,
  simulatorRequestPayload: null,
  openSimulatorModal: (payload) => set({ isSimulatorModalOpen: true, simulatorRequestPayload: payload }),
  closeSimulatorModal: () => set({ isSimulatorModalOpen: false, simulatorRequestPayload: null }),

  terminalSessions: [{
    id: initialSessionId,
    name: `Terminal 1`,
    history: [],
    commandHistory: [],
  }],
  activeTerminalId: initialSessionId,

  addTerminalSession: () => set(state => {
    const newId = `terminal-${Date.now()}`;
    const newSession: TerminalSession = {
      id: newId,
      name: `Terminal ${state.terminalSessions.length + 1}`,
      history: [],
      commandHistory: [],
    };
    return {
      terminalSessions: [...state.terminalSessions, newSession],
      activeTerminalId: newId,
    };
  }),

  closeTerminalSession: (sessionId: string) => {
    if (terminalSockets.has(sessionId)) {
        terminalSockets.get(sessionId)?.close();
        terminalSockets.delete(sessionId);
    }
    set(state => {
      const newSessions = state.terminalSessions.filter(s => s.id !== sessionId);
      let newActiveId = state.activeTerminalId;

      if (state.activeTerminalId === sessionId) {
        if (newSessions.length > 0) {
            const closingIndex = state.terminalSessions.findIndex(s => s.id === sessionId);
            const newIndex = Math.max(0, closingIndex - 1);
            newActiveId = newSessions[newIndex].id;
        } else {
            newActiveId = null;
        }
      }
      
      if (newSessions.length === 0) {
          const newId = `terminal-${Date.now()}`;
          newSessions.push({
              id: newId,
              name: `Terminal 1`,
              history: [],
              commandHistory: [],
          });
          newActiveId = newId;
      }

      return { terminalSessions: newSessions, activeTerminalId: newActiveId };
    })
  },

  setActiveTerminalId: (sessionId: string) => set({ activeTerminalId: sessionId }),

  addCommandToSessionHistory: (command: string) => set(state => ({
    terminalSessions: state.terminalSessions.map(session => {
        if (session.id === state.activeTerminalId) {
            return { ...session, commandHistory: [command, ...session.commandHistory]};
        }
        return session;
    })
  })),

  clearTerminalHistory: () => set(state => ({
    terminalSessions: state.terminalSessions.map(session => {
      if (session.id === state.activeTerminalId) {
        return { ...session, history: [] };
      }
      return session;
    })
  })),

  executeTerminalCommand: async (command: string) => {
    const { projectRoot, activeTerminalId } = get();

    if (command.trim().toLowerCase() === 'clear') {
      if (activeTerminalId) get().clearTerminalHistory();
      return;
    }

    if (!projectRoot || !activeTerminalId) {
      console.error("Cannot execute command: missing projectRoot or activeTerminalId");
      return;
    }

    if (terminalSockets.has(activeTerminalId)) {
        terminalSockets.get(activeTerminalId)?.close();
        terminalSockets.delete(activeTerminalId);
    }

    const entryId = Date.now();
    const commandEntry: TerminalEntry = {
      id: entryId,
      command,
      output: '',
      isError: false,
      isRunning: true,
    };

    set(state => ({
      terminalSessions: state.terminalSessions.map(session =>
        session.id === activeTerminalId
          ? { ...session, history: [...session.history, commandEntry] }
          : session
      ),
    }));

    const socket = new WebSocket('ws://localhost:2077/api/v2/terminal/ws');
    terminalSockets.set(activeTerminalId, socket);

    socket.onopen = () => {
      get().addCommandToSessionHistory(command);
      socket.send(JSON.stringify({ command, project_root: projectRoot }));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      set(state => ({
        terminalSessions: state.terminalSessions.map(session => {
          if (session.id === activeTerminalId) {
            const newHistory = session.history.map(entry => {
              if (entry.id === entryId) {
                const newEntry = { ...entry };
                if (msg.type === 'stdout' || msg.type === 'stderr') {
                  newEntry.output += msg.data;
                }
                if (msg.type === 'stderr' || msg.type === 'error') {
                  newEntry.isError = true;
                }
                if (msg.type === 'exit') {
                  newEntry.isRunning = false;
                  newEntry.output += `\n[Process exited: ${msg.data}]\n`;
                }
                return newEntry;
              }
              return entry;
            });
            return { ...session, history: newHistory };
          }
          return session;
        })
      }));
    };

    const handleCloseOrError = (event?: Event) => {
       set(state => ({
        terminalSessions: state.terminalSessions.map(session => {
          if (session.id === activeTerminalId) {
             const newHistory = session.history.map(entry => {
              if (entry.id === entryId && entry.isRunning) {
                let errorMessage = '\n[Process disconnected unexpectedly]';
                if (event && event instanceof ErrorEvent) {
                    errorMessage = `\n[WebSocket Error: ${event.message}]`;
                }
                return { ...entry, isRunning: false, isError: true, output: entry.output + errorMessage };
              }
              return entry;
            });
            return { ...session, history: newHistory };
          }
          return session;
        })
      }));
      terminalSockets.delete(activeTerminalId);
    }

    socket.onerror = handleCloseOrError;
    socket.onclose = handleCloseOrError;
  },
  llmProviderConfigs: [],
  setLLMProviderConfigs: (configs) => set({ llmProviderConfigs: configs }),
  loadInitialData: async () => {
      const [agents, llmConfigs] = await Promise.all([fetchAgents(), fetchLLMConfigs()]);
      set({ agents, llmProviderConfigs: llmConfigs });
      if (agents.length > 0 && !get().activeAgent) {
          set({ activeAgent: agents[0] });
      }
  },

  clipboard: null,
  setClipboard: (data) => set({ clipboard: data }),

  createFile: async (path: string) => {
    const { projectRoot, refreshFileTree } = get();
    if (!projectRoot) return;
    const result = await apiCreateFile(projectRoot, path);
    if (result.success) {
        await refreshFileTree();
    } else {
        console.error("Failed to create file:", result.error);
    }
  },

  deleteNode: async (node: TreeNodeData) => {
      const { projectRoot, refreshFileTree, closeFile } = get();
      if (!projectRoot) return;
      if (node.type === 'file') {
          const result = await apiDeleteFile(projectRoot, node.path);
          if (result.success) {
              await refreshFileTree();
              closeFile(node.id);
              closeFile(`diff:${node.path}`); 
          } else {
              console.error("Failed to delete file:", result.error);
          }
      }
  },

  pasteNode: async (destinationDir: string) => {
      const { projectRoot, clipboard, refreshFileTree } = get();
      if (!projectRoot || !clipboard) return;
      
      const destinationPath = `${destinationDir}/${clipboard.name}`.replace(/\\/g, '/').replace(/\/\//g, '/');

      if (clipboard.type === 'file') {
          const result = await apiCopyFile(projectRoot, clipboard.path, destinationPath);
          if (result.success) {
              await refreshFileTree();
          } else {
              console.error("Failed to paste node:", result.error);
          }
      }
  },

}), shallow);
