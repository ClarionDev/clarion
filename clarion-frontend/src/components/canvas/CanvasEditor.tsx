import { useState, useRef, WheelEvent, MouseEvent, useEffect, useCallback } from 'react';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import CanvasNode, { CanvasNodeData, BlockType } from './CanvasNode';
import ContextMenu from './ContextMenu';
import CanvasEdge, { CanvasEdgeData } from './CanvasEdge';

interface CanvasEditorProps {
  initialNodes?: CanvasNodeData[];
  initialEdges?: CanvasEdgeData[];
}

const CanvasEditor = ({ initialNodes = [], initialEdges = [] }: CanvasEditorProps) => {
  const [nodes, setNodes] = useState<CanvasNodeData[]>(initialNodes);
  const [edges, setEdges] = useState<CanvasEdgeData[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dragInfo, setDragInfo] = useState<{ active: boolean, id: string | null, offset: { x: number, y: number } }>({ active: false, id: null, offset: { x: 0, y: 0 } });
  const [connectingInfo, setConnectingInfo] = useState<{ active: boolean, sourceId: string | null, mousePosition: {x: number, y: number}}>({ active: false, sourceId: null, mousePosition: {x: 0, y: 0}});

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const addNode = (type: BlockType) => {
    if (!contextMenu || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newNode: CanvasNodeData = {
        id: `${type.toLowerCase()}-${Date.now()}`,
        type,
        name: `New ${type}`,
        position: {
            x: (contextMenu.x - rect.left - viewport.x) / viewport.zoom,
            y: (contextMenu.y - rect.top - viewport.y) / viewport.zoom,
        }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteSelection = useCallback(() => {
    if (selectedNodeId) {
      setNodes(nodes => nodes.filter(n => n.id !== selectedNodeId));
      setEdges(edges => edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
    if (selectedEdgeId) {
      setEdges(edges => edges.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelection();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelection]);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY > 0 ? viewport.zoom / zoomFactor : viewport.zoom * zoomFactor;
    setViewport(v => ({ ...v, zoom: Math.max(0.2, Math.min(newZoom, 3)) }));
  };

  const handleNodeMouseDown = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const initialMouseX = (e.clientX - viewport.x) / viewport.zoom;
    const initialMouseY = (e.clientY - viewport.y) / viewport.zoom;

    setDragInfo({
        active: true,
        id: nodeId,
        offset: {
            x: initialMouseX - node.position.x,
            y: initialMouseY - node.position.y
        }
    });
  }

  const handleHandleMouseDown = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const rect = canvasRef.current!.getBoundingClientRect();
    setConnectingInfo({ 
        active: true, 
        sourceId: nodeId, 
        mousePosition: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    });
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (contextMenu) closeContextMenu();
    const target = e.target as HTMLElement;
    if (target.closest('[data-handle-id]') || target.closest('[data-node-id]')) return;

    if (target === canvasRef.current || target.tagName === 'svg' || target.tagName === 'path') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        isPanning.current = true;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (dragInfo.active && dragInfo.id) {
        const newX = (e.clientX - viewport.x) / viewport.zoom - dragInfo.offset.x;
        const newY = (e.clientY - viewport.y) / viewport.zoom - dragInfo.offset.y;
        setNodes(nodes => nodes.map(n => n.id === dragInfo.id ? { ...n, position: { x: newX, y: newY } } : n));
    }

    if (connectingInfo.active) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setConnectingInfo(info => ({ ...info, mousePosition: { x: e.clientX - rect.left, y: e.clientY - rect.top } }));
    }
    
    if (isPanning.current) {
        const dx = e.clientX - lastMousePosition.current.x;
        const dy = e.clientY - lastMousePosition.current.y;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        setViewport(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (connectingInfo.active && connectingInfo.sourceId) {
        const targetEl = e.target as HTMLElement;
        const targetNodeEl = targetEl.closest('[data-node-id]');
        const targetNodeId = targetNodeEl?.getAttribute('data-node-id');
            
        if(targetNodeId && targetNodeId !== connectingInfo.sourceId){
            const newEdge: CanvasEdgeData = {
                id: `edge-${connectingInfo.sourceId}-${targetNodeId}-${Date.now()}`,
                source: connectingInfo.sourceId,
                target: targetNodeId
            };
            setEdges(edges => [...edges, newEdge]);
        }
    }

    setDragInfo({ active: false, id: null, offset: {x: 0, y: 0}});
    setConnectingInfo({ active: false, sourceId: null, mousePosition: {x: 0, y: 0}});
    isPanning.current = false;
  };
  
  const resetView = () => setViewport({ x: 0, y: 0, zoom: 1 });
  const zoomIn = () => setViewport(v => ({ ...v, zoom: Math.min(v.zoom * 1.2, 3) }));
  const zoomOut = () => setViewport(v => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.2) }));

  const calculateEdgePath = (sourceId: string, targetId: string): string => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return '';

    // Bottom handle of source node (width: 256/2=128, height: approx 92)
    const sourcePos = { x: sourceNode.position.x + 128, y: sourceNode.position.y + 92 }; 
    // Top handle of target node
    const targetPos = { x: targetNode.position.x + 128, y: targetNode.position.y };

    const dy = Math.abs(targetPos.y - sourcePos.y);
    const controlPointYOffset = Math.max(50, dy / 2);

    return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x} ${sourcePos.y + controlPointYOffset}, ${targetPos.x} ${targetPos.y - controlPointYOffset}, ${targetPos.x} ${targetPos.y}`;
  };

  const getPreviewEdgePath = () => {
    if (!connectingInfo.active || !connectingInfo.sourceId) return '';
    const sourceNode = nodes.find(n => n.id === connectingInfo.sourceId);
    if (!sourceNode) return '';

    const sourcePos = { x: sourceNode.position.x + 128, y: sourceNode.position.y + 40 };
    const targetPos = { 
        x: (connectingInfo.mousePosition.x - viewport.x) / viewport.zoom,
        y: (connectingInfo.mousePosition.y - viewport.y) / viewport.zoom
    };
    
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;

    return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + dx * 0.5} ${sourcePos.y} ${targetPos.x - dx * 0.5} ${targetPos.y} ${targetPos.x} ${targetPos.y}`;
  }

  return (
    <div className="h-full w-full bg-gray-dark rounded-lg border-r border-gray-light overflow-hidden flex flex-col relative">
      <div
        ref={canvasRef}
        className="flex-grow w-full h-full cursor-default"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #3c3c3c 1px, transparent 0)',
            backgroundSize: '20px 20px'
        }}
      >
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: 'top left',
            width: '100%',
            height: '100%'
          }}
        >
         <svg className='absolute w-full h-full' style={{ pointerEvents: 'none' }}>
            {edges.map(edge => 
                <CanvasEdge 
                    key={edge.id} 
                    id={edge.id}
                    path={calculateEdgePath(edge.source, edge.target)} 
                    isSelected={selectedEdgeId === edge.id}
                    onSelect={setSelectedEdgeId}
                />
            )}
            {connectingInfo.active && <path d={getPreviewEdgePath()} stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,5" />} 
         </svg>
          {nodes.map(node => (
            <CanvasNode 
                key={node.id} 
                node={node} 
                isSelected={selectedNodeId === node.id} 
                onNodeMouseDown={handleNodeMouseDown}
                onHandleMouseDown={handleHandleMouseDown}
             />
          ))}
        </div>
      </div>
      
       {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu} onSelect={addNode} />}

      <div className="absolute bottom-4 right-4 bg-gray-medium border border-gray-light rounded-lg flex items-center p-1 shadow-lg">
            <button onClick={zoomOut} className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-light rounded"><Minus size={16}/></button>
            <span className="px-2 text-sm w-12 text-center select-none">{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-light rounded"><Plus size={16}/></button>
            <div className="w-px h-5 bg-gray-light mx-1"></div>
            <button onClick={resetView} className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-light rounded"><LocateFixed size={16}/></button>
      </div>
    </div>
  );
};

export default CanvasEditor;