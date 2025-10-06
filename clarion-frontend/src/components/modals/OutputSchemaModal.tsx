import { useAppStore } from '../../store/store';
import { Braces, X } from 'lucide-react';
import Button from '../ui/Button';
import CodeViewer from '../ui/CodeViewer';
import { saveAgent, fetchAgents } from '../../lib/api'; // Import API functions

const OutputSchemaModal = () => {
  const { activeConfigSection, setActiveConfigSection, agentStateForEdit, setAgentStateForEdit, setActiveAgent, setAgents } = useAppStore();
  
  if (activeConfigSection !== 'outputSchema' || !agentStateForEdit) {
    return null;
  }

  const handleSave = async () => {
    if (!agentStateForEdit) return;

    const result = await saveAgent(agentStateForEdit);
    if (result.success) {
      const updatedAgents = await fetchAgents();
      setAgents(updatedAgents);

      const updatedActiveAgent = updatedAgents.find(a => a.id === agentStateForEdit.id);
      if (updatedActiveAgent) {
        setActiveAgent(updatedActiveAgent);
      }
      
      setAgentStateForEdit(null); // Clear editing state
      setActiveConfigSection(null);
    } else {
      console.error("Failed to save agent via modal:", result.error);
      // Optionally, you could add a user-facing error notification here
    }
  };

  const handleCancel = () => {
    setAgentStateForEdit(null); // Discard changes
    setActiveConfigSection(null);
  };

  const handleSchemaChange = (schemaStr: string) => {
     try {
      const parsedSchema = JSON.parse(schemaStr);
      if (agentStateForEdit) {
          setAgentStateForEdit({ 
              ...agentStateForEdit, 
              // Correctly wrap the schema in the expected object structure
              outputSchema: { schema: parsedSchema } 
            });
      }
    } catch (e) {
      // This will be caught by the JSON parser, but you could add inline error UI
    }
  }

  // Safely access the nested schema object for the editor
  const schemaContent = agentStateForEdit.outputSchema && typeof agentStateForEdit.outputSchema === 'object' && 'schema' in agentStateForEdit.outputSchema 
    ? (agentStateForEdit.outputSchema as { schema: object }).schema 
    : agentStateForEdit.outputSchema;


  return (
    <div 
      onClick={handleCancel}
      className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0'
    >
      <div 
        onClick={e => e.stopPropagation()}
        className='bg-gray-medium border border-gray-light rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[70vh]'
      >
        <header className='p-4 border-b border-gray-light flex-shrink-0 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
                <Braces className='w-5 h-5 text-accent-blue' />
                <div>
                    <h2 className='font-bold text-lg'>Edit Output Schema</h2>
                    <p className='text-sm text-text-secondary'>Define the expected JSON structure of the AI's response.</p>
                </div>
            </div>
            <button onClick={handleCancel} className='p-1.5 rounded-md hover:bg-gray-light/50'>
                <X size={18} />
            </button>
        </header>

        <main className='flex-grow p-4 overflow-y-auto'>
           <CodeViewer 
            content={JSON.stringify(schemaContent, null, 2)}
            onChange={handleSchemaChange}
           />
        </main>

        <footer className='p-4 border-t border-gray-light flex-shrink-0 flex justify-end items-center gap-3'>
            <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </footer>
      </div>
    </div>
  );
};

export default OutputSchemaModal;
