import { useState } from 'react';
import { Book, Check } from 'lucide-react';
import Button from '../ui/Button';
import { schemaPresets } from '../../data/schema-presets';
import { cn } from '../../lib/utils';

interface SchemaTemplateSelectorProps {
  onSelect: (schema: object) => void;
}

export const SchemaTemplateSelector = ({ onSelect }: SchemaTemplateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (schema: object) => {
    onSelect(schema);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Book size={16} className="mr-2" />
        Load from Template
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-medium border border-gray-light rounded-lg shadow-xl z-10 py-2 animate-in fade-in-0 zoom-in-95">
          <p className='px-4 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider'>Select a Preset</p>
          <ul className='mt-1'>
            {schemaPresets.map((preset) => (
              <li key={preset.name}>
                <button
                  onClick={() => handleSelect(preset.schema)}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-light/50"
                >
                  <p className='font-semibold'>{preset.name}</p>
                  <p className='text-xs text-text-secondary'>{preset.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};