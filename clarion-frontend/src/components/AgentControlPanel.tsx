import PromptZone from './PromptZone';
import GitNav from './GitNav';
import ConversationHistory from './ConversationHistory';

const AgentControlPanel = () => {
  return (
    <div className="flex flex-col h-full bg-gray-medium/50 border-r border-gray-light">
      <GitNav />
      <ConversationHistory />
      <PromptZone />
    </div>
  );
};

export default AgentControlPanel;