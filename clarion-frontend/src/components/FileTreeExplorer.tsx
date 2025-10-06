import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgentControlPanel from "./AgentControlPanel";
import { useState, useMemo, useCallback, useEffect } from 'react';
import { TreeNodeData } from '../data/file-tree';
import FileTree from './FileTree';
import Editor from "./Editor";
import EditorTabs from "./EditorTabs";
import { Search, Plus, FolderOpen, Layout } from 'lucide-react';
import Terminal from "./Terminal";
import { useAppStore } from "../store/store";
import AgentNav from "./AgentNav";
import MainDiffViewer from "./MainDiffViewer";
import FileExplorerContextMenu from "./ui/FileExplorerContextMenu";

const FileTreeExplorer = () => {
  const {
    currentProject,
    fileTree,
    openFiles,
    activeFileId,
    setActiveFileId,
    closeFile,
    createFile,
    deleteNode,
    setClipboard,
    clipboard,
    pasteNode,
    updateOpenFileContent,
    saveActiveFile,
  } = useAppStore();
  
  const [layout, setLayout] = useState<'default' | 'terminal-right'>('default');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TreeNodeData } | null>(null);

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener('keydown', handleSave);
    return () => {
      window.removeEventListener('keydown', handleSave);
    };
  }, [saveActiveFile]);

  const handleContextMenu = useCallback((event: React.MouseEvent, node: TreeNodeData) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  const closeContextMenu = () => setContextMenu(null);

  const handleNewFileInRoot = () => {
    const fileName = prompt("Enter new file name:");
    if (fileName) {
      createFile(fileName);
    }
  };

  const menuItems = useMemo(() => {
    if (!contextMenu) return [];
    const { node } = contextMenu;
    const isFolder = node.type === 'folder';

    const handleNewFile = () => {
      const fileName = prompt("Enter new file name:");
      if (fileName && fileName.trim()) {
        let dirPath = '';
        if (node.type === 'folder') {
          dirPath = node.path;
        } else {
          const lastSlashIndex = node.path.lastIndexOf('/');
          if (lastSlashIndex > -1) {
            dirPath = node.path.substring(0, lastSlashIndex);
          }
        }
        const newPath = dirPath ? `${dirPath}/${fileName.trim()}` : fileName.trim();
        createFile(newPath);
      }
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
            deleteNode(node);
        }
    };

    const handleCopy = () => {
        setClipboard({ path: node.path, name: node.name, type: node.type });
    };
    
    const handlePaste = () => {
        if (isFolder) {
            pasteNode(node.path);
        } else {
            const dirPath = node.path.substring(0, node.path.lastIndexOf('/') + 1);
            pasteNode(dirPath);
        }
    };

    let items = [
      { label: 'New File', action: handleNewFile },
    ];
    if (isFolder || clipboard) {
      items.push({ label: 'Paste', action: handlePaste, disabled: !clipboard });
    }
    
    items.push({ isSeparator: true });
    items.push({ label: 'Copy', action: handleCopy });
    items.push({ label: 'Delete', action: handleDelete });
    
    return items;
  }, [contextMenu, clipboard, createFile, deleteNode, setClipboard, pasteNode]);

  const projectRootNode = useMemo((): TreeNodeData | null => {
    if (!currentProject) {
      return null;
    }
    const projectName = currentProject.name;
    return {
      id: 'project-root',
      name: projectName,
      path: '',
      type: 'folder',
      children: fileTree,
    };
  }, [currentProject, fileTree]);

  const activeFile = openFiles.find(file => file.id === activeFileId);

  if (!currentProject) {
      return (
          <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center">
                  <FolderOpen size={48} className="mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Project Selected</h3>
                  <p>Select a project from the Projects view to begin.</p>
              </div>
          </div>
      )
  }

  const fileExplorerPanel = (
    <Panel collapsible={true} defaultSize={35} minSize={25} order={1}>
      <div className="bg-gray-medium/25 flex flex-col h-full overflow-hidden">
        <div className='p-2.5 border-b border-gray-light flex justify-between items-center'>
          <h3 className="text-sm font-semibold uppercase tracking-wider">File Explorer</h3>
          <div className="flex items-center gap-2 text-text-secondary">
              <button onClick={() => setLayout(l => l === 'default' ? 'terminal-right' : 'default')} className='p-1 hover:text-text-primary' title="Toggle Terminal Position">
                  <Layout size={16} />
              </button>
              <button className='p-1 hover:text-text-primary'><Search size={16} /></button>
              <button onClick={handleNewFileInRoot} className='p-1 hover:text-text-primary'><Plus size={16} /></button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-2">
          {projectRootNode && <FileTree nodes={[projectRootNode]} onContextMenu={handleContextMenu} />}
        </div>
      </div>
    </Panel>
  );

  const codeViewerPanel = (
    <Panel minSize={30} order={2}>
      <div className="bg-gray-dark/50 flex flex-col h-full overflow-hidden">
        <EditorTabs 
            openFiles={openFiles} 
            activeFileId={activeFileId}
            onSelectTab={setActiveFileId} 
            onCloseTab={closeFile} 
        />
        <div className="flex-grow h-full overflow-hidden">
            {activeFile ? (
                activeFile.isDiff ? (
                    <MainDiffViewer 
                        key={activeFile.id} 
                        oldValue={activeFile.originalContent || ''} 
                        newValue={activeFile.content || ''}
                    />
                ) : (
                    <Editor 
                        key={activeFile.id} 
                        content={activeFile.content || ''}
                        readOnly={!!activeFile.isDiff}
                        onChange={(value) => {
                          if(activeFileId) {
                            updateOpenFileContent(activeFileId, value)
                          }
                        }}
                    />
                )
            ) : (
                <div className='flex items-center justify-center h-full text-text-secondary'>
                    <p>Select a file to view its content</p>
                </div>
            )}
        </div>
      </div>
    </Panel>
  )

  const mainEditorGroup = (
    <PanelGroup direction="horizontal">
        {fileExplorerPanel}
        <PanelResizeHandle className='w-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
        {codeViewerPanel}
    </PanelGroup>
  );

  return (
    <>
      <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel collapsible={true} defaultSize={30} minSize={25}>
              <AgentControlPanel />
          </Panel>
          <PanelResizeHandle className='w-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
          <Panel minSize={30} className="flex flex-col">
              <AgentNav />
              <div className="flex-grow overflow-hidden">
                  {layout === 'default' ? (
                      <PanelGroup direction="vertical">
                          <Panel defaultSize={70} minSize={30}>
                              {mainEditorGroup}
                          </Panel>
                          <PanelResizeHandle className='h-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
                          <Panel collapsible={true} defaultSize={30} minSize={15}>
                              <Terminal />
                          </Panel>
                      </PanelGroup>
                  ) : (
                      <PanelGroup direction="horizontal">
                          <Panel defaultSize={70} minSize={30}>
                              {mainEditorGroup}
                          </Panel>
                          <PanelResizeHandle className='w-1.5 bg-gray-dark hover:bg-accent-blue/50 transition-colors data-[resize-handle-state=drag]:bg-accent-blue' />
                          <Panel collapsible={true} defaultSize={30} minSize={20}>
                              <Terminal />
                          </Panel>
                      </PanelGroup>
                  )}
              </div>
          </Panel>
      </PanelGroup>
      {contextMenu && <FileExplorerContextMenu x={contextMenu.x} y={contextMenu.y} items={menuItems} onClose={closeContextMenu} />}
    </>
  );
};

export default FileTreeExplorer;
