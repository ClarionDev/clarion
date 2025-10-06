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
    writeFileContent,
    Project,
    fetchProjects,
    openProject as apiOpenProject,
    updateProject,
    fetchRunsForProject,
    saveRun,
} from '../lib/api';
import { LLMProviderConfig } from "../data/llm-configs";
import { open } from '@tauri-apps/plugin-dialog';

export type ActiveView = 'projects' | 'file-tree' | 'agent-persona' | 'knowledge-base' | 'marketplace' | 'canvas-editor' | 'llm-configs';
export type AgentStatus = 'idle' | 'running' | 'success' | 'error';
export type AgentConfigSection = 'systemPrompt' | 'outputSchema' | 'codebase' | null;

export interface OpenFile extends TreeNodeData {
    isDiff?: boolean;
    originalContent?: string;
    isDirty?: boolean;
}

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
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  openProject: (path?: string) => Promise<void>;

  projects: Project[];
  loadProjects: () => Promise<void>;

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
  loadRunsForProject: (projectId: string) => Promise<void>;
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
  setActiveAgent: (agent: AgentPersona | null, fromInitialLoad?: boolean) => void;
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

export const useAppStore = createWithEqualityFn<AppState>((set, get) => ({
  activeView: 'projects',
  setActiveView: (view) => set({ activeView: view }),
  currentProject: null,
  projects: [],
  loadProjects: async () => {
    const projects = await fetchProjects();
    set({ projects });
  },
  setCurrentProject: (project) => {
    if (project) {
        set({ currentProject: project, fileTree: [], openFiles: [], activeFileId: null, contextFilePaths: new Set(), runs: [] });
        get().refreshFileTree();
        get().loadRunsForProject(project.id);
    } else {
        set({ currentProject: null, fileTree: [], openFiles: [], activeFileId: null, contextFilePaths: new Set(), runs: [] });
    }
  },
  openProject: async (path?: string) => {
      let projectPath = path;
      if (!projectPath) {
        const selectedPath = await open({
            directory: true,
            multiple: false,
        });
        if (typeof selectedPath === 'string') {
            projectPath = selectedPath;
        }
      }

      if (projectPath) {
        try {
            const project = await apiOpenProject(projectPath);
            if (project) {
                get().setCurrentProject(project);
                await get().loadProjects();
                set({ activeView: 'file-tree' });
            }
        } catch (error) {
            console.error("Failed to open project:", error);
        }
      }
  },

  fileTree: [],
  setFileTree: (data) => set({ fileTree: data }),
  refreshFileTree: async () => {
    const { currentProject } = get();
    if (currentProject) {
      const newTree = await fetchDirectoryTree(currentProject.path);
      set({ fileTree: newTree });
    }
  },

  refreshOpenFileContent: async (path: string) => {
    const { currentProject, openFiles } = get();
    const fileToRefresh = openFiles.find(f => f.path === path);

    if (currentProject && fileToRefresh) {
      const fullPath = `${currentProject.path}/${path}`;
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

    const { openFiles, currentProject } = get();
    if (openFiles.some(f => f.id === node.id)) {
      set({ activeFileId: node.id });
      return;
    }

    const newOpenFile: OpenFile = { ...node, content: 'Loading...', isDirty: false };
    set(state => ({ 
      openFiles: [...state.openFiles, newOpenFile],
      activeFileId: node.id
    }));

    if (currentProject) {
        const fullPath = `${currentProject.path}/${node.path}`;
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
    const { activeFileId, openFiles, currentProject } = get();
    if (!activeFileId || !currentProject) return;

    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile || !activeFile.isDirty || activeFile.isDiff) return;

    const result = await writeFileContent(currentProject.path, activeFile.path, activeFile.content || '');

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
  loadRunsForProject: async (projectId: string) => {
    const runs = await fetchRunsForProject(projectId);
    set({ runs });
  },
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
    const updatedRun = newRuns.find(run => run.id === id);
    
    if (state.currentRunStatus === 'running' && data.status && data.status !== 'running') {
        newState.currentRunStatus = 'idle';
        if (state.currentProject && updatedRun) {
            saveRun(state.currentProject.id, updatedRun).then(result => {
                if (!result.success) {
                    console.error("Failed to save run:", result.error);
                }
            });
        }
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
        if (state.currentProject) {
            saveRun(state.currentProject.id, newRun).then(result => {
                if (!result.success) {
                    console.error("Failed to save simulated run:", result.error);
                }
            });
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
  setActiveAgent: (agent, fromInitialLoad = false) => {
    const { activeAgent: currentActiveAgent, currentProject, loadProjects } = get();

    if (agent?.id === currentActiveAgent?.id) {
        return;
    }
    
    set({ activeAgent: agent });

    if (fromInitialLoad) {
        return;
    }

    if (currentProject && agent) {
        const updatedProject = { ...currentProject, activeAgentId: agent.id };
        
        updateProject(updatedProject).then(result => {
            if (result.success) {
                loadProjects(); 
            } else {
                console.error("Failed to update project's active agent:", result.error);
            }
        });
    }
  },
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
    const { currentProject, activeTerminalId } = get();

    if (command.trim().toLowerCase() === 'clear') {
      if (activeTerminalId) get().clearTerminalHistory();
      return;
    }

    if (!currentProject || !activeTerminalId) {
      console.error("Cannot execute command: missing currentProject or activeTerminalId");
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

    const socket = new WebSocket('ws://localhost:2038/api/v2/terminal/ws');
    terminalSockets.set(activeTerminalId, socket);

    socket.onopen = () => {
      get().addCommandToSessionHistory(command);
      socket.send(JSON.stringify({ command, project_root: currentProject.path }));
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
      const { setCurrentProject, setActiveAgent } = get();
      const [agents, llmConfigs, projects] = await Promise.all([fetchAgents(), fetchLLMConfigs(), fetchProjects()]);
      
      set({ agents, llmProviderConfigs: llmConfigs, projects });
  
      if (projects.length > 0) {
          const latestProject = projects[0]; // Backend sorts by last updated/opened
          
          setCurrentProject(latestProject);
          
          let agentToSet: AgentPersona | null = null;
          if (latestProject.activeAgentId) {
              agentToSet = agents.find(a => a.id === latestProject.activeAgentId) || null;
          }
  
          // Fallback to first agent if no active agent set for project or if agent was deleted
          if (!agentToSet && agents.length > 0) {
              agentToSet = agents[0];
          }
          
          if (agentToSet) {
              setActiveAgent(agentToSet, true); // Use flag to prevent redundant API call
          }
          
          set({ activeView: 'file-tree' });
  
      } else if (agents.length > 0 && !get().activeAgent) {
          // Fallback for when there are no projects yet, just set a default agent
          setActiveAgent(agents[0], true);
      }
  },

  clipboard: null,
  setClipboard: (data) => set({ clipboard: data }),

  createFile: async (path: string) => {
    const { currentProject, refreshFileTree } = get();
    if (!currentProject) return;
    const result = await apiCreateFile(currentProject.path, path);
    if (result.success) {
        await refreshFileTree();
    } else {
        console.error("Failed to create file:", result.error);
    }
  },

  deleteNode: async (node: TreeNodeData) => {
      const { currentProject, refreshFileTree, closeFile } = get();
      if (!currentProject) return;
      if (node.type === 'file') {
          const result = await apiDeleteFile(currentProject.path, node.path);
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
      const { currentProject, clipboard, refreshFileTree } = get();
      if (!currentProject || !clipboard) return;
      
      const destinationPath = `${destinationDir}/${clipboard.name}`.replace(/\\/g, '/').replace(/\/\//g, '/');

      if (clipboard.type === 'file') {
          const result = await apiCopyFile(currentProject.path, clipboard.path, destinationPath);
          if (result.success) {
              await refreshFileTree();
          } else {
              console.error("Failed to paste node:", result.error);
          }
      }
  },

}), shallow);
