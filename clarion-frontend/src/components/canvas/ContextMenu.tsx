import { Bot, Fingerprint, FileCode2 } from 'lucide-react';
import { BlockType } from './CanvasNode';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSelect: (item: BlockType) => void;
}

const ContextMenu = ({ x, y, onClose, onSelect }: ContextMenuProps) => {
  const menuItems = [
    { type: 'Agent', label: 'New Agent', icon: Bot },
    { type: 'PromptTemplate', label: 'New Prompt Template', icon: Fingerprint },
    { type: 'FilterSet', label: 'New Filter Set', icon: FileCode2 },
  ];

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
  };

  return (
    <div
      className="fixed bg-gray-medium border border-gray-light rounded-lg shadow-xl z-50 w-60 py-2"
      style={{ top: y, left: x }}
    >
      <ul>
        {menuItems.map(item => (
          <li key={item.type}>
            <button
              onClick={() => handleSelect(item.type as BlockType)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-light/50"
            >
              <item.icon className="w-4 h-4 text-text-secondary" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;