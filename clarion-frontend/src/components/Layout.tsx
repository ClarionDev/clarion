import Sidebar from './Sidebar';
import MainContent from './MainContent';
import SystemPromptModal from './modals/SystemPromptModal';
import OutputSchemaModal from './modals/OutputSchemaModal';
import CodebaseContextModal from './modals/CodebaseContextModal';
import SimulatorModal from './modals/SimulatorModal';

const Layout = () => {
  return (
    <div className="flex h-full bg-gray-dark text-text-primary">    
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContent />
      </div>
      
      <SystemPromptModal />
      <OutputSchemaModal />
      <CodebaseContextModal />
      <SimulatorModal />
    </div>
  );
};

export default Layout;
