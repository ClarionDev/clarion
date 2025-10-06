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
  const { activeAgent, fileTree, currentProject, setAgentFilteredFilePaths, loadInitialData } = useAppStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!currentProject?.path) {
        return;
    }

    const socket = new WebSocket('ws://localhost:2038/api/v2/fs/watch');

    socket.onopen = () => {
        console.log('File watcher connection established.');
        socket.send(JSON.stringify({ path: currentProject.path }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.event === 'change') {
                console.log(`File change detected: ${data.path}, op: ${data.op}`);
                
                const { refreshFileTree, openFiles, refreshOpenFileContent } = useAppStore.getState();
                
                refreshFileTree();

                const changedFileIsOpen = openFiles.some(file => file.path === data.path);
                if (changedFileIsOpen && data.op !== 'REMOVE') {
                    refreshOpenFileContent(data.path);
                }
            }
        } catch (e) {
            console.error("Error parsing file watcher message:", e);
        }
    };

    socket.onerror = (error) => {
        console.error('File watcher WebSocket error:', error);
    };

    socket.onclose = () => {
        console.log('File watcher connection closed.');
    };

    return () => {
        socket.close();
    };
  }, [currentProject?.path]);

  useEffect(() => {
    const updateFilteredContext = async () => {
      const hasFilters = activeAgent && (activeAgent.codebaseFilters?.includeGlobs?.length > 0 || activeAgent.codebaseFilters?.excludeGlobs?.length > 0);
      
      if (hasFilters && currentProject && fileTree.length > 0) {
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
  }, [activeAgent, fileTree, currentProject, setAgentFilteredFilePaths]);

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
