import { MouseEvent } from 'react';
import { Bot, Fingerprint, FileCode2, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type BlockType = "Agent" | "PromptTemplate" | "FilterSet" | "Message" | "UserVariableDef" | "OutputSchema";

export interface CanvasNodeData {
  id: string;
  type: BlockType;
  position: { x: number; y: number };
  name: string;
}

interface CanvasNodeProps {
  node: CanvasNodeData;
  isSelected: boolean;
  onNodeMouseDown: (e: MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onHandleMouseDown: (e: MouseEvent<HTMLDivElement>, nodeId: string) => void;
}

const blockTypeIcons: Record<BlockType, LucideIcon> = {
    Agent: Bot,
    PromptTemplate: Fingerprint,
    FilterSet: FileCode2,
    Message: Fingerprint, 
    UserVariableDef: Fingerprint,
    OutputSchema: Bot,
};


const CanvasNode = ({ node, isSelected, onNodeMouseDown, onHandleMouseDown }: CanvasNodeProps) => {
    const Icon = blockTypeIcons[node.type] || Fingerprint;

  return (
    <div
      data-node-id={node.id}
      className={cn("absolute bg-gray-medium border rounded-lg w-64 shadow-lg select-none transition-colors duration-200", {
        'border-accent-blue ring-2 ring-accent-blue/50': isSelected,
        'border-gray-light': !isSelected,
        'cursor-grab active:cursor-grabbing': !isSelected,
        'cursor-move': isSelected
      })}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
    >
        <div className="p-3 border-b border-gray-light/50 flex items-center gap-2 pointer-events-none">
            <Icon className="w-4 h-4 text-accent-blue" />
            <span className="font-bold text-sm text-text-primary tracking-wide">{node.type}</span>
        </div>
        <div className="p-3 pointer-events-none">
            <p className="text-text-primary">{node.name}</p>
        </div>

        {/* Connection Handles */}
        <div data-handle-id={`${node.id}-top`} onMouseDown={(e) => onHandleMouseDown(e, node.id)} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-light rounded-full border-2 border-gray-dark hover:bg-accent-blue cursor-crosshair"></div>
        <div data-handle-id={`${node.id}-bottom`} onMouseDown={(e) => onHandleMouseDown(e, node.id)} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-light rounded-full border-2 border-gray-dark hover:bg-accent-blue cursor-crosshair"></div>
        <div data-handle-id={`${node.id}-left`} onMouseDown={(e) => onHandleMouseDown(e, node.id)} className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-light rounded-full border-2 border-gray-dark hover:bg-accent-blue cursor-crosshair"></div>
        <div data-handle-id={`${node.id}-right`} onMouseDown={(e) => onHandleMouseDown(e, node.id)} className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-light rounded-full border-2 border-gray-dark hover:bg-accent-blue cursor-crosshair"></div>
    </div>
  );
};

export default CanvasNode;