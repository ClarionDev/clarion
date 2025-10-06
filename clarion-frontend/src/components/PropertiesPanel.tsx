import { AgentPersona } from '../data/agent-personas';
import { countTokens } from '../lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import Label from './ui/Label';
import Input from './ui/Input';
import Button from './ui/Button';
import { PlusCircle, X, Trash2, Info, Package, FileSearch, ChevronRight, Book, LayoutList, Code as CodeIcon, Eye } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/store';
import { TreeNodeData } from '../data/file-tree';
import FileIcon from './FileIcon';
import { cn } from '../lib/utils';
import { fetchFilterPreview } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { SchemaTemplateSelector } from './agent-editor/SchemaTemplateSelector';
import { VisualSchemaBuilder } from './agent-editor/visual-schema-builder/VisualSchemaBuilder';
import { generateExampleFromJsonSchema } from '../lib/schema-utils';

interface PropertiesPanelProps {
  agent: AgentPersona;
  onAgentChange: (changedFields: Partial<AgentPersona>) => void;
}

export const CoreIdentityTab = ({ agent, onAgentChange }: PropertiesPanelProps) => (
    <div className='p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full'>
        <div>
            <Label htmlFor='agentName'>Agent Name</Label>
            <Input id='agentName' value={agent.name} onChange={e => onAgentChange({ name: e.target.value})} />
        </div>
        <div>
            <Label htmlFor='agentDesc'>Description</Label>
            <Input id='agentDesc' value={agent.description} onChange={e => onAgentChange({ description: e.target.value})} />
        </div>
        <div>
             <Label className='flex justify-between items-center'>System Prompt <span className='text-xs text-text-secondary font-normal'>{countTokens(agent.systemPrompt)} tokens</span></Label>
             <div className='border border-gray-light rounded-md overflow-hidden'>
                <CodeMirror value={agent.systemPrompt} onChange={value => onAgentChange({ systemPrompt: value})} extensions={[javascript()]} theme={oneDark} height="250px" />
             </div>
        </div>
    </div>
);

// In clarion-frontend/src/components/PropertiesPanel.tsx

export const LLMSettingsTab = ({ agent, onAgentChange }: PropertiesPanelProps) => {
    const { llmProviderConfigs } = useAppStore();

    const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const configId = e.target.value;
        const selectedConfig = llmProviderConfigs.find(c => c.id === configId);
        if (selectedConfig) {
            onAgentChange({ 
                llmConfig: { 
                    ...(agent.llmConfig || { provider: '', model: '', parameters: {} }),
                    configId: selectedConfig.id, 
                    provider: selectedConfig.provider 
                }
            });
        }
    };
    
    // Helper to update a specific parameter
    const handleParamChange = (paramName: string, value: string | number) => {
        onAgentChange({
            llmConfig: {
                ...(agent.llmConfig),
                parameters: {
                    ...agent.llmConfig.parameters,
                    [paramName]: value,
                }
            }
        });
    }

    const params = agent.llmConfig?.parameters || {};

    return (
        <div className='p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full'>
            <div>
                <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <Label htmlFor='llmConfigId'>API Key Configuration</Label>
                        <select 
                            id='llmConfigId' 
                            value={agent.llmConfig?.configId || ''} 
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
                            value={agent.llmConfig?.model || ''} 
                            onChange={e => onAgentChange({ llmConfig: { ...(agent.llmConfig), model: e.target.value }})}
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
                    <div>
                        <Label htmlFor='llmReasoning'>Reasoning Effort</Label>
                         <select 
                            id='llmReasoning'
                            value={params.reasoning_effort || 'auto'}
                            onChange={e => handleParamChange('reasoning_effort', e.target.value)}
                            className='w-full bg-gray-dark border border-gray-light rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm'
                          >
                            <option value="auto">Auto</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                    </div>
                </div>
                 <p className='text-xs text-text-secondary mt-4'>We recommend altering Temperature or Top P, but not both.</p>
            </div>
        </div>
    );
}

const globTooltipContent = (
    <div className='text-left max-w-xs p-1'>
        <p className='font-bold mb-2'>Glob Pattern Quick Guide:</p>
        <ul className='space-y-1 text-xs list-disc list-inside'>
            <li><code className='bg-gray-dark px-1 rounded'>*</code> matches any number of characters, but not <code className='bg-gray-dark px-1 rounded'>/</code></li>
            <li><code className='bg-gray-dark px-1 rounded'>**</code> matches any number of characters including <code className='bg-gray-dark px-1 rounded'>/</code></li>
            <li><code className='bg-gray-dark px-1 rounded'>?</code> matches a single character</li>
            <li><code className='bg-gray-dark px-1 rounded'>[abc]</code> matches one character in the brackets</li>
            <li><code className='bg-gray-dark px-1 rounded'>{`{src,test}`}</code> matches any of the strings</li>
        </ul>
        <p className='text-xs mt-2'>E.g., <code className='bg-gray-dark px-1 rounded'>src/**/*.tsx</code> includes all TSX files in the src directory.</p>
    </div>
);

const presets = {
    'Node.js': ['node_modules/**', 'dist/**', 'build/**', '*.log'],
    'Python': ['**/__pycache__/**', '*.venv/**', 'venv/**', '.idea/**'],
    'Go': ['vendor/**', 'bin/**'],
}

const getAllFilePaths = (nodes: TreeNodeData[]): string[] => {
    let paths: string[] = [];
    for (const node of nodes) {
        if (node.type === 'file') {
            paths.push(node.path);
        } else if (node.children) {
            paths = paths.concat(getAllFilePaths(node.children));
        }
    }
    return paths;
};


type FileStatus = 'included' | 'excluded' | 'folder';
interface PreviewNode extends TreeNodeData {
    status: FileStatus;
    children?: PreviewNode[];
    hasIncludedChildren?: boolean;
}

const PreviewTreeNode = ({ node, level = 0 }: { node: PreviewNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isFolder = node.type === 'folder';
  const isIncluded = node.status === 'included';
  const textColor = isIncluded ? 'text-text-primary' : 'text-text-secondary/50';

  return (
    <div>
        <div 
            className={`flex items-center py-0.5 rounded-sm ${textColor} ${isFolder ? 'cursor-pointer' : ''}`}
            style={{ paddingLeft: `${level * 1.25}rem` }}
            onClick={() => isFolder && setIsExpanded(!isExpanded)}
        >
             <div className="w-4 h-4 mr-1 flex-shrink-0 flex items-center justify-center">
                {isFolder && (
                <ChevronRight
                    className={cn('w-4 h-4 transition-transform', { 'rotate-90': isExpanded })}
                />
                )}
            </div>
            <FileIcon filename={node.name} type={node.type} isExpanded={isExpanded} />
            <span className="truncate text-sm flex-grow">{node.name}</span>
        </div>
        {isExpanded && isFolder && node.children && (
            <PreviewFileTree nodes={node.children} level={level + 1} />
        )}
    </div>
  )
}

const PreviewFileTree = ({ nodes, level = 0 }: { nodes: PreviewNode[]; level?: number }) => {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-0.5">
      {sortedNodes.map(node => <PreviewTreeNode key={node.id} node={node} level={level} />)}
    </div>
  );
}

export const CodeContextTab = ({ agent, onAgentChange }: PropertiesPanelProps) => {
    const { fileTree } = useAppStore(state => ({ fileTree: state.fileTree }));
    const [previewTree, setPreviewTree] = useState<PreviewNode[]>([]);
    const [includedFileCount, setIncludedFileCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const allFilePaths = useMemo(() => getAllFilePaths(fileTree), [fileTree]);

    const includeGlobs = useMemo(() => agent.codebaseFilters?.includeGlobs || [], [agent.codebaseFilters]);
    const excludeGlobs = useMemo(() => agent.codebaseFilters?.excludeGlobs || [], [agent.codebaseFilters]);

    const debouncedIncludeGlobs = useDebounce(includeGlobs, 300);
    const debouncedExcludeGlobs = useDebounce(excludeGlobs, 300);

    const isStale = useMemo(() => {
        return JSON.stringify(includeGlobs) !== JSON.stringify(debouncedIncludeGlobs) ||
               JSON.stringify(excludeGlobs) !== JSON.stringify(debouncedExcludeGlobs);
    }, [includeGlobs, excludeGlobs, debouncedIncludeGlobs, debouncedExcludeGlobs]);

    useEffect(() => {
        const updatePreview = async () => {
            if (allFilePaths.length === 0) return;
            setIsLoading(true);
            const statuses = await fetchFilterPreview(allFilePaths, debouncedIncludeGlobs, debouncedExcludeGlobs);
            
            let count = 0;

            function processNode(node: TreeNodeData): PreviewNode | null {
                if (node.type === 'file') {
                    const status = statuses[node.path] === 'included' ? 'included' : 'excluded';
                    if (status === 'included') count++;
                    return { ...node, status };
                }

                if (node.type === 'folder' && node.children) {
                    const children = node.children.map(processNode).filter((c): c is PreviewNode => c !== null);
                    const hasIncludedChildren = children.some(c => c.status === 'included' || c.hasIncludedChildren);
                    
                    if (hasIncludedChildren) {
                        return { ...node, children, hasIncludedChildren, status: 'folder' };
                    }
                }
                return null;
            }

            const newPreviewTree = fileTree.map(processNode).filter((n): n is PreviewNode => n !== null);
            setPreviewTree(newPreviewTree);
            setIncludedFileCount(count);
            setIsLoading(false);
        }

        updatePreview();
    }, [debouncedIncludeGlobs, debouncedExcludeGlobs, allFilePaths, fileTree]);


    const handleGlobChange = (type: 'include' | 'exclude', index: number, value: string) => {
        const key = type === 'include' ? 'includeGlobs' : 'excludeGlobs';
        const newGlobs = (agent.codebaseFilters[key] || []).map((glob, i) => i === index ? value : glob);
        onAgentChange({ codebaseFilters: { ...agent.codebaseFilters, [key]: newGlobs } });
    }

    const addGlob = (type: 'include' | 'exclude') => {
        const key = type === 'include' ? 'includeGlobs' : 'excludeGlobs';
        const newGlobs = [...(agent.codebaseFilters[key] || []), ''];
        onAgentChange({ codebaseFilters: { ...agent.codebaseFilters, [key]: newGlobs } });
    }

    const removeGlob = (type: 'include' | 'exclude', index: number) => {
        const key = type === 'include' ? 'includeGlobs' : 'excludeGlobs';
        const newGlobs = (agent.codebaseFilters[key] || []).filter((_, i) => i !== index);
        onAgentChange({ codebaseFilters: { ...agent.codebaseFilters, [key]: newGlobs } });
    }

    const applyPreset = (presetName: keyof typeof presets) => {
        const presetGlobs = presets[presetName];
        const currentExcludeGlobs = agent.codebaseFilters?.excludeGlobs || [];
        const newExcludeGlobs = [...new Set([...currentExcludeGlobs, ...presetGlobs])];
        onAgentChange({ codebaseFilters: { ...agent.codebaseFilters, excludeGlobs: newExcludeGlobs } });
    }

    return (
       <PanelGroup direction='horizontal' className='h-full'>
            <Panel defaultSize={50} minSize={30}>
                <div className='p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full'>
                    <div className='p-4 rounded-lg bg-gray-medium/80 border border-gray-light'>
                        <h3 className='font-semibold mb-2 flex items-center gap-2'><Package size={18} className='text-accent-blue'/> Apply an Exclude Preset</h3>
                        <p className='text-xs text-text-secondary mb-3'>Quickly add common ignore patterns for different project types. Presets will be added to your existing list.</p>
                        <div className='flex items-center gap-2'>
                            {Object.keys(presets).map(name => (
                                <Button key={name} onClick={() => applyPreset(name as keyof typeof presets)} variant='secondary' size='sm'>{name}</Button>
                            ))}
                        </div>
                    </div>

                    <div className='grid grid-cols-1 gap-6'>
                        <div className='p-4 rounded-lg bg-gray-medium/80 border border-gray-light'>
                            <div className='flex items-center gap-2 mb-3'>
                                <h3 className='font-semibold'>Include Patterns</h3>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><button className='text-text-secondary'><Info size={14}/></button></TooltipTrigger><TooltipContent>{globTooltipContent}</TooltipContent></Tooltip></TooltipProvider>
                            </div>
                            <p className='text-xs text-text-secondary mb-3'>Specify which files the agent should read. If empty, all files not excluded are included.</p>
                            <div className='space-y-2'>
                                {includeGlobs.map((glob, i) => (
                                    <div key={i} className='flex items-center gap-2'>
                                        <Input value={glob} onChange={e => handleGlobChange('include', i, e.target.value)} placeholder='e.g. src/**/*.tsx' />
                                        <Button onClick={() => removeGlob('include', i)} variant='ghost' size='icon' className='text-text-secondary h-9 w-9'><X size={16}/></Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => addGlob('include')} variant='ghost' size='sm' className='mt-3 text-accent-blue'><PlusCircle size={16} className='mr-2'/> Add Pattern</Button>
                        </div>
                        <div className='p-4 rounded-lg bg-gray-medium/80 border border-gray-light'>
                            <div className='flex items-center gap-2 mb-3'>
                                <h3 className='font-semibold'>Exclude Patterns</h3>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><button className='text-text-secondary'><Info size={14}/></button></TooltipTrigger><TooltipContent>{globTooltipContent}</TooltipContent></Tooltip></TooltipProvider>
                            </div>
                             <p className='text-xs text-text-secondary mb-3'>Specify files or directories to ignore. Exclude rules take priority over include rules.</p>
                            <div className='space-y-2'>
                                {excludeGlobs.map((glob, i) => (
                                    <div key={i} className='flex items-center gap-2'>
                                        <Input value={glob} onChange={e => handleGlobChange('exclude', i, e.target.value)} placeholder='e.g. **/node_modules/**' />
                                        <Button onClick={() => removeGlob('exclude', i)} variant='ghost' size='icon' className='text-text-secondary h-9 w-9'><X size={16}/></Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => addGlob('exclude')} variant='ghost' size='sm' className='mt-3 text-accent-blue'><PlusCircle size={16} className='mr-2'/> Add Pattern</Button>
                        </div>
                    </div>
                </div>
            </Panel>
            <PanelResizeHandle className='w-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
            <Panel defaultSize={50} minSize={30}>
                <div className='h-full flex flex-col'>
                     <div className='p-4 border-b border-gray-light flex-shrink-0 flex items-center gap-2'>
                        <FileSearch size={16} className='text-text-secondary'/>
                        <h3 className='font-semibold text-sm'>Context Preview
                          <span className='text-text-secondary font-normal ml-2'>
                             ({isLoading || isStale ? 'Updating...' : `${includedFileCount} files included`})
                          </span>
                        </h3>
                    </div>
                    <div className='flex-grow overflow-y-auto p-2'>
                        {previewTree.length > 0 ? (
                           <PreviewFileTree nodes={previewTree} />
                        ) : (
                            <div className='flex items-center justify-center h-full text-text-secondary text-center text-sm'>
                                <p>No files match the current filters or no folder is open.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Panel>
       </PanelGroup>
    );
}

export const OutputSchemaTab = ({ agent, onAgentChange }: PropertiesPanelProps) => {
    const [viewMode, setViewMode] = useState<'code' | 'visual'>('code');
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const schemaForEditor = useMemo(() => {
        if (agent.outputSchema && typeof agent.outputSchema === 'object' && 'schema' in agent.outputSchema) {
            return (agent.outputSchema as { schema: object }).schema;
        }
        return agent.outputSchema || {};
    }, [agent.outputSchema]);

    const [schemaStr, setSchemaStr] = useState(JSON.stringify(schemaForEditor, null, 2));

    useEffect(() => {
        setSchemaStr(JSON.stringify(schemaForEditor, null, 2));
    }, [schemaForEditor]);

    const handleSchemaChange = useCallback((value: string) => {
        setSchemaStr(value);
        try {
            const parsed = JSON.parse(value);
            onAgentChange({ outputSchema: { schema: parsed } });
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    }, [onAgentChange]);

    const handleVisualBuilderChange = useCallback((newSchema: object) => {
        const formatted = JSON.stringify(newSchema, null, 2);
        setSchemaStr(formatted);
        onAgentChange({ outputSchema: { schema: newSchema } });
        setError(null);
    }, [onAgentChange]);

    const handleTemplateSelect = (schema: object) => {
        const formatted = JSON.stringify(schema, null, 2);
        handleSchemaChange(formatted);
    }

    const exampleOutput = useMemo(() => {
        if (error) return '{\n  "error": "Invalid JSON Schema"\n}';
        try {
            const example = generateExampleFromJsonSchema(schemaForEditor);
            return JSON.stringify(example, null, 2);
        } catch {
            return '{\n  "error": "Could not generate preview"\n}';
        }
    }, [schemaForEditor, error]);

    return (
         <div className='p-6 h-full flex flex-col gap-4'>
            <div className='flex-shrink-0 flex justify-between items-center'>
                <div className='flex items-center gap-4'>
                    <Label>JSON Output Schema</Label>
                     <div className='flex items-center border border-gray-light rounded-md p-0.5 bg-gray-dark/50'>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <button onClick={() => setViewMode('visual')} className={cn('p-1.5 rounded-sm', { 'bg-gray-medium': viewMode === 'visual' })}>
                                <LayoutList size={16} />
                            </button>
                        </TooltipTrigger><TooltipContent><p>Visual Builder</p></TooltipContent></Tooltip></TooltipProvider>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <button onClick={() => setViewMode('code')} className={cn('p-1.5 rounded-sm', { 'bg-gray-medium': viewMode === 'code' })}>
                                <CodeIcon size={16} />
                            </button>
                        </TooltipTrigger><TooltipContent><p>Code Editor</p></TooltipContent></Tooltip></TooltipProvider>
                     </div>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='sm' onClick={() => setIsPreviewVisible(!isPreviewVisible)} className={cn({'text-accent-blue': isPreviewVisible})}>
                        <Eye size={16} className='mr-2'/> Preview
                    </Button>
                    <SchemaTemplateSelector onSelect={handleTemplateSelect} />
                    <Button variant='secondary' size='sm' onClick={() => { onAgentChange({ outputSchema: { schema: schemaForEditor }}) }}>Save</Button>
                </div>
            </div>
            
            <PanelGroup direction='horizontal' className='flex-grow'>
                <Panel>
                     <div className='h-full w-full border border-gray-light rounded-md overflow-hidden relative'>
                        {viewMode === 'code' ? (
                            <CodeMirror 
                                value={schemaStr} 
                                onChange={handleSchemaChange}
                                extensions={[javascript({ jsx: false, typescript: false, json: true })]} 
                                theme={oneDark} 
                                height="100%" 
                                style={{ height: '100%'}}
                            />
                        ) : (
                           <VisualSchemaBuilder 
                                schema={schemaForEditor} 
                                onChange={handleVisualBuilderChange}
                            />
                        )}
                    </div>
                </Panel>
                {isPreviewVisible && (
                    <>
                        <PanelResizeHandle className='w-2 bg-gray-dark/50 hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
                        <Panel defaultSize={40} minSize={25}>
                            <div className='h-full flex flex-col pl-2'>
                                <Label className='flex-shrink-0 mb-2'>Example Output Preview</Label>
                                <div className='border border-gray-light rounded-md overflow-hidden flex-grow'>
                                    <CodeMirror 
                                        value={exampleOutput} 
                                        readOnly
                                        extensions={[javascript({ jsx: false, typescript: false, json: true })]} 
                                        theme={oneDark} 
                                        height="100%" 
                                        style={{ height: '100%'}}
                                    />
                                </div>
                            </div>
                        </Panel>
                    </>
                )}
            </PanelGroup>

            {viewMode === 'code' && error && (
                <div className='flex-shrink-0 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-xs font-mono'>
                    <p className='font-bold mb-1'>Invalid JSON</p>
                    {error}
                </div>
            )}
        </div>
    )
}

export const UserVariablesTab = ({ agent, onAgentChange }: PropertiesPanelProps) => {

    const handleVarChange = (index: number, field: 'name' | 'description', value: string) => {
        const newVariables = (agent.userVariables || []).map((variable, i) => {
            if (i === index) {
                return { ...variable, [field]: value };
            }
            return variable;
        });
        onAgentChange({ userVariables: newVariables });
    }

    const addVariable = () => {
        const newVariables = [...(agent.userVariables || []), { name: '', description: '', required: false }];
        onAgentChange({ userVariables: newVariables });
    }

    const removeVariable = (index: number) => {
        const newVariables = (agent.userVariables || []).filter((_, i) => i !== index);
        onAgentChange({ userVariables: newVariables });
    }

    return (
        <div className='p-6 space-y-4 max-w-4xl mx-auto w-full overflow-y-auto h-full'>
            {(agent.userVariables || []).map((variable, i) => (
                <div key={i} className='p-4 rounded-lg bg-gray-medium border border-gray-light flex items-start gap-4'>
                    <div className='flex-grow space-y-3'>
                        <Input placeholder='Variable Name (e.g. component_name)' value={variable.name} onChange={e => handleVarChange(i, 'name', e.target.value)} />
                        <Input placeholder='Description for the user' value={variable.description} onChange={e => handleVarChange(i, 'description', e.target.value)} />
                    </div>
                    <Button onClick={() => removeVariable(i)} variant='ghost' size='icon' className='text-text-secondary h-9 w-9 mt-1'><Trash2 size={16}/></Button>
                </div>
            ))}
            <Button onClick={addVariable} variant='secondary' className='w-full'><PlusCircle size={16} className='mr-2'/> Add Variable</Button>
        </div>
    );
}

export const PlaygroundTab = ({ agent }: { agent: AgentPersona }) => {
    return (
         <div className='p-6 h-full flex flex-col gap-6 max-w-4xl mx-auto w-full'>
             <p className='text-sm text-text-secondary'>This is a placeholder for a future agent testing playground where you can run this agent against a sample codebase with specific inputs to verify its behavior.</p>
        </div>
    )
}