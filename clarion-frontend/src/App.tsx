import { useEffect } from 'react';
import Header from "./components/Header";
import Layout from "./components/Layout";
import { useAppStore } from './store/store';
import { fetchFilterPreview } from './lib/api';
import { TreeNodeData } from './data/file-tree';

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

function App() {
  const { activeAgent, fileTree, projectRoot, setAgentFilteredFilePaths, loadInitialData } = useAppStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const updateFilteredContext = async () => {
      const hasFilters = activeAgent && (activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0);
      
      if (hasFilters && projectRoot && fileTree.length > 0) {
        const allFilePaths = getAllFilePaths(fileTree);
        const statuses = await fetchFilterPreview(
          allFilePaths, 
          activeAgent.codebaseFilters.includeGlobs || [], 
          activeAgent.codebaseFilters.excludeGlobs || []
        );
        const includedPaths = Object.entries(statuses)
          .filter(([, status]) => status === 'included')
          .map(([path]) => path);
        
        setAgentFilteredFilePaths(new Set(includedPaths));
      } else {
        setAgentFilteredFilePaths(new Set());
      }
    };

    updateFilteredContext();
  }, [activeAgent, fileTree, projectRoot, setAgentFilteredFilePaths]);

  return (
    <div className="flex flex-col h-screen bg-gray-dark text-text-primary">
      <Header />
      <main className="flex-grow overflow-hidden">
        <Layout />
      </main>
    </div>
  );
}

export default App;