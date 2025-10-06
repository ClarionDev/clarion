import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { jsonSchemaToUi, uiToJSONSchema, UIField } from '../../../lib/schema-utils';
import { cn } from '../../../lib/utils';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface VisualSchemaBuilderProps {
  schema: object;
  onChange: (newSchema: object) => void;
}

const TypeSelector = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-gray-dark border border-gray-light rounded-md py-1.5 px-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue text-sm w-28"
  >
    <option value="string">String</option>
    <option value="number">Number</option>
    <option value="boolean">Boolean</option>
    <option value="object">Object</option>
    <option value="array">Array</option>
  </select>
);

const SchemaField = ({ field, onUpdate, onRemove, onAddChild, level = 0 }: {
  field: UIField;
  onUpdate: (id: string, updates: Partial<UIField>) => void;
  onRemove: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isObject = field.type === 'object';
  const isArray = field.type === 'array';
  const isNestable = isObject || isArray;

  return (
    <div className='flex flex-col'>
        <div className='flex items-center gap-2' style={{ paddingLeft: `${level * 1.5}rem`}}>
            <div className='w-4'>
            {isNestable && (
                <button onClick={() => setIsExpanded(!isExpanded)} className='text-text-secondary hover:text-text-primary'>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
            )}
            </div>
            <Input 
                placeholder="Field Name"
                value={field.name}
                onChange={e => onUpdate(field.id, { name: e.target.value })}
                className='flex-grow'
            />
            <TypeSelector value={field.type} onChange={type => onUpdate(field.id, { type })} />
            <Button variant="ghost" size="icon" onClick={() => onRemove(field.id)} className='text-text-secondary h-8 w-8 flex-shrink-0'>
                <Trash2 size={16} />
            </Button>
        </div>
        {isExpanded && isNestable && (
            <div className='mt-2 pl-4 border-l-2 border-gray-light/50 space-y-2' style={{ marginLeft: `${level * 1.5 + 1.25}rem` }}>
                {field.children.map(child => (
                    <SchemaField 
                        key={child.id}
                        field={child}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        onAddChild={onAddChild}
                        level={level + 1}
                    />
                ))}
                {onAddChild && (
                    <Button onClick={() => onAddChild(field.id)} variant='ghost' size='sm' className='text-accent-blue'>
                        <PlusCircle size={14} className='mr-2'/> Add Nested Field
                    </Button>
                )}
            </div>
        )}
    </div>
  )
}

export const VisualSchemaBuilder = ({ schema, onChange }: VisualSchemaBuilderProps) => {
  const [fields, setFields] = useState<UIField[]>([]);

  useEffect(() => {
    // Only update from props if the external schema is different from the internal one.
    // This prevents wiping local state while typing.
    const currentSchemaFromState = uiToJSONSchema(fields);
    if (JSON.stringify(currentSchemaFromState) !== JSON.stringify(schema)) {
         setFields(jsonSchemaToUi(schema));
    }
  }, [schema]);

  const handleUpdate = () => {
      onChange(uiToJSONSchema(fields));
  }

  const updateField = (id: string, updates: Partial<UIField>) => {
      let newFields = [...fields];
      const findAndUpdate = (items: UIField[]): UIField[] => {
          return items.map(item => {
              if (item.id === id) {
                  const updatedItem = { ...item, ...updates };
                  // If type changes from nestable to non-nestable, remove children
                  if (item.type !== updatedItem.type && (item.type === 'object' || item.type === 'array')) {
                      updatedItem.children = [];
                  }
                   // If type changes to nestable, add children array
                  if (item.type !== updatedItem.type && (updatedItem.type === 'object' || updatedItem.type === 'array')) {
                      updatedItem.children = [];
                  }
                  return updatedItem;
              }
              if (item.children) {
                  return { ...item, children: findAndUpdate(item.children) };
              }
              return item;
          })
      }
      newFields = findAndUpdate(newFields);
      setFields(newFields);
      onChange(uiToJSONSchema(newFields));
  }

  const removeField = (id: string) => {
      let newFields = [...fields];
      const findAndRemove = (items: UIField[], targetId: string): UIField[] => {
          return items.filter(item => item.id !== targetId).map(item => {
              if (item.children) {
                  return { ...item, children: findAndRemove(item.children, targetId) };
              }
              return item;
          });
      };
      newFields = findAndRemove(newFields, id);
      setFields(newFields);
      onChange(uiToJSONSchema(newFields));
  }

  const addField = (parentId?: string) => {
      const newField: UIField = { id: `field_${Date.now()}`, name: '', type: 'string', children: [] };
      if (!parentId) {
          const newFields = [...fields, newField];
          setFields(newFields);
          onChange(uiToJSONSchema(newFields));
      } else {
          let newFields = [...fields];
          const findAndAdd = (items: UIField[]): UIField[] => {
              return items.map(item => {
                  if (item.id === parentId) {
                      return { ...item, children: [...item.children, newField] };
                  }
                  if (item.children) {
                       return { ...item, children: findAndAdd(item.children) };
                  }
                  return item;
              })
          };
          newFields = findAndAdd(newFields);
          setFields(newFields);
          onChange(uiToJSONSchema(newFields));
      }
  }

  return (
    <div className="h-full w-full bg-gray-dark/50 p-4 overflow-y-auto">
      <div className='space-y-3'>
        {fields.map(field => (
           <SchemaField 
              key={field.id} 
              field={field} 
              onUpdate={updateField} 
              onRemove={removeField}
              onAddChild={addField}
            />
        ))}
        <Button onClick={() => addField()} variant='secondary' className='w-full'>
            <PlusCircle size={16} className='mr-2' /> Add Root Field
        </Button>
      </div>
    </div>
  );
};