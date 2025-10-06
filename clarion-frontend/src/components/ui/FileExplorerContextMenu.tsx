import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  isSeparator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const FileExplorerContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-48 bg-gray-medium border border-gray-light rounded-md shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => {
        if (item.isSeparator) {
          return <div key={`sep-${index}`} className="h-px bg-gray-light my-1" />;
        }

        return (
          <button
            key={index}
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
            className={cn(
              'w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-gray-light/50 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default FileExplorerContextMenu;
