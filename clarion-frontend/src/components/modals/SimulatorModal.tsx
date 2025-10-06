import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/store';
import { Beaker, X } from 'lucide-react';
import Button from '../ui/Button';
import CodeViewer from '../ui/CodeViewer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { fetchPreparedPrompt, PreparedPromptResponse } from '../../lib/api';
import { generateExampleFromJsonSchema } from '../../lib/schema-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import HumanizedRequestViewer from './HumanizedRequestViewer';
import SimplifiedJsonViewer from './SimplifiedJsonViewer';

const SimulatorModal = () => {
  const { 
    isSimulatorModalOpen, 
    closeSimulatorModal, 
    simulatorRequestPayload,
    createRunFromSimulatorOutput
  } = useAppStore();

  const [requestJson, setRequestJson] = useState('Loading request data...');
  const [requestMarkdown, setRequestMarkdown] = useState('Loading markdown data...');
  const [responseJson, setResponseJson] = useState(''); // Start with an empty string by default
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processRequest = async () => {
      if (isSimulatorModalOpen && simulatorRequestPayload) {
        try {
          setRequestJson('Generating prompt from backend...');
          setRequestMarkdown('Generating prompt from backend...');
          
          const response: PreparedPromptResponse = await fetchPreparedPrompt(simulatorRequestPayload);
          
          setRequestJson(response.jsonPrompt);
          setRequestMarkdown(response.markdownPrompt);

          // *** CHANGE: Set the initial response to be empty ***
          setResponseJson(''); 
          
        } catch (e) {
            console.error("Failed to prepare prompt:", e);
            const errorMessage = (e as Error).message;
            setRequestJson(`// Error fetching prompt:\n${errorMessage}`);
            setRequestMarkdown(`# Error fetching prompt:\n${errorMessage}`);
        }
      } else {
        // Clear all state when the modal is not open
        setRequestJson('Loading request data...');
        setRequestMarkdown('Loading markdown data...');
        setResponseJson('');
      }
    };
    processRequest();
  }, [isSimulatorModalOpen, simulatorRequestPayload]);

  if (!isSimulatorModalOpen) {
    return null;
  }

  const handleCreateRun = () => {
    if (!simulatorRequestPayload) return;
    try {
      // Allow empty JSON object if the input is empty
      const jsonToParse = responseJson.trim() === '' ? '{}' : responseJson;
      const parsedJson = JSON.parse(jsonToParse);
      setError(null);
      createRunFromSimulatorOutput(simulatorRequestPayload, parsedJson);
      closeSimulatorModal();
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
    }
  };
  
  // *** NEW: Handler to generate the example on demand ***
  const handleGenerateExample = () => {
    if (simulatorRequestPayload?.output_schema) {
      const exampleOutput = generateExampleFromJsonSchema(simulatorRequestPayload.output_schema);
      setResponseJson(JSON.stringify(exampleOutput, null, 2));
    }
  };

  return (
    <div 
      onClick={closeSimulatorModal}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[85vh]'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <Beaker className='w-5 h-5 text-accent-blue' />
                <div>
                    <h2 className='font-bold text-lg'>Agent LLM Simulator</h2>
                    <p className='text-sm text-text-secondary'>Manually craft the LLM's response to a generated prompt.</p>
                </div>
            </div>
            <button onClick={closeSimulatorModal} className='p-1.5 rounded-md hover:bg-gray-light/50'>
                <X size={18} />
            </button>
        </header>

        <main className='flex-grow overflow-hidden'>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50} minSize={30}>
              <div className='h-full flex flex-col p-4'>
                <Tabs defaultValue="humanized" className="flex-grow flex flex-col">
                  <TabsList className="mb-2 self-start">
                    <TabsTrigger value="humanized">Humanized</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                    <TabsTrigger value="request">Raw Request</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="humanized" className="flex-grow overflow-hidden">
                    <HumanizedRequestViewer jsonString={requestJson} />
                  </TabsContent>
                  <TabsContent value="json" className="flex-grow overflow-hidden">
                    <SimplifiedJsonViewer jsonString={requestJson} />
                  </TabsContent>
                  <TabsContent value="request" className="flex-grow overflow-hidden">
                    <CodeViewer content={requestJson} readOnly showCopyButton />
                  </TabsContent>
                   <TabsContent value="markdown" className="flex-grow overflow-hidden">
                     <CodeViewer content={requestMarkdown} readOnly showCopyButton />
                  </TabsContent>
                </Tabs>
              </div>
            </Panel>
            <PanelResizeHandle className='w-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
            <Panel defaultSize={50} minSize={30}>
                <div className='h-full flex flex-col p-4'>
                    {/* *** CHANGE: Updated header for the response panel *** */}
                    <div className='flex justify-between items-center mb-2'>
                      <p className='text-sm font-semibold text-text-secondary'>Simulated Response (Editable)</p>
                      <Button variant="secondary" size="sm" onClick={handleGenerateExample}>
                        <Beaker size={14} className="mr-2" />
                        Generate Example
                      </Button>
                    </div>
                    <CodeViewer content={responseJson} onChange={setResponseJson} />
                    {error && (
                      <div className='mt-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-xs font-mono'>
                          {error}
                      </div>
                    )}
                </div>
            </Panel>
          </PanelGroup>
        </main>

        <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center gap-3'>
            <Button variant='secondary' onClick={closeSimulatorModal}>Cancel</Button>
            <Button onClick={handleCreateRun}>Create Run</Button>
        </footer>
      </div>
    </div>
  );
};

export default SimulatorModal;