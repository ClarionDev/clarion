import { useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import DataSourceList, { DataSource } from './DataSourceList';

const initialDataSources: DataSource[] = [
  { id: '1', type: 'url', value: 'https://pepe-agent-docs.dev/introduction', status: 'Complete' },
  { id: '2', type: 'github', value: 'https://github.com/user/pepe-agent', status: 'Pending' },
];

const KnowledgeBaseManager = () => {
  const [sources, setSources] = useState<DataSource[]>(initialDataSources);
  const [isIndexing, setIsIndexing] = useState(false);

  const handleAddSource = (source: Omit<DataSource, 'id' | 'status'>) => {
    setSources(prev => [
      ...prev,
      { ...source, id: String(Date.now()), status: 'Pending' }
    ]);
  };

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleBuildKnowledgeBase = () => {
    console.log("Starting knowledge base build...");
    setIsIndexing(true);
    setTimeout(() => {
      setIsIndexing(false);
      setSources(prev => prev.map(s => ({...s, status: 'Complete'})))
      console.log("Build complete!");
    }, 5000); 
  };

  return (
    <div className="bg-gray-medium rounded-lg border border-gray-light p-6 flex flex-col h-full text-text-primary">
      <div className="border-b border-gray-light pb-4 mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <BrainCircuit className="w-6 h-6 mr-3 text-accent-blue" />
          Manage Knowledge Base
        </h2>
        <p className="text-text-secondary mt-1">Add data sources to build a specialized knowledge base for your agents.</p>
      </div>

      <div className="flex-grow mb-6">
        <DataSourceList
          sources={sources}
          onAddSource={handleAddSource}
          onRemoveSource={handleRemoveSource}
          isIndexing={isIndexing}
        />
      </div>

      <div className="mt-auto pt-6 border-t border-gray-light">
        <button
          onClick={handleBuildKnowledgeBase}
          disabled={isIndexing || sources.length === 0}
          className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:bg-gray-light disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isIndexing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Indexing Knowledge Base...
            </>
          ) : (
            'Build Knowledge Base'
          )}
        </button>
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;