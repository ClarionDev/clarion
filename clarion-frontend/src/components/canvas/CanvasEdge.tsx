import { cn } from "../../lib/utils";

export interface CanvasEdgeData {
  id: string;
  source: string; 
  target: string;
}

interface CanvasEdgeProps {
  id: string;
  path: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CanvasEdge = ({ id, path, isSelected, onSelect }: CanvasEdgeProps) => {
  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(id); }} className="cursor-pointer group" style={{ pointerEvents: 'all' }}>
      <path
        d={path}
        strokeWidth="10"
        fill="none"
        stroke="transparent"
      />
      <path
        d={path}
        stroke={isSelected ? '#3b82f6' : '#a0a0a0'}
        strokeWidth="2"
        fill="none"
        className={cn("transition-all", {
            'group-hover:stroke-[#3b82f6]': !isSelected
        })}
      />
    </g>
  );
};

export default CanvasEdge;