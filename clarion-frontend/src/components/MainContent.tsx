import React from 'react';
import { useAppStore } from '../store/store';
import FileTreeExplorer from './FileTreeExplorer';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import Marketplace from './Marketplace';
import CanvasEditor from './canvas/CanvasEditor';
import AgentPersonaManager from './AgentPersonaManager';
import {LLMConfigManager} from './LLMConfigManager';
import ProjectsView from './ProjectsView';

const MainContent = () => {
  const { activeView } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case 'projects':
        return <ProjectsView />;
      case 'file-tree':
        return <FileTreeExplorer />;
      case 'agent-persona':
        return <AgentPersonaManager />;
      case 'llm-configs':
        return <LLMConfigManager />;
      case 'canvas-editor':
        return <CanvasEditor />;
      case 'knowledge-base':
        return <KnowledgeBaseManager />;
      case 'marketplace':
        return <Marketplace />;
      default:
        return <ProjectsView />;
    }
  }

  return (
    <main className="flex-1 h-full overflow-hidden">
      {renderContent()}
    </main>
  );
};

export default MainContent;
