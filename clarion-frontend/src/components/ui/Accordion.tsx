import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionContextProps {
  value: string[] | string | null;
  onValueChange: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextProps | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion provider');
  }
  return context;
};

const AccordionItemContext = createContext<{ value: string }>({ value: '' });

export const Accordion = ({ children, defaultValue, className, type = 'single', collapsible = false }: { 
  children: ReactNode, 
  defaultValue?: string | string[], 
  className?: string, 
  type?: 'single' | 'multiple',
  collapsible?: boolean 
}) => {
  const [value, setValue] = useState<string[] | string | null>(defaultValue || (type === 'multiple' ? [] : null));

  const handleValueChange = useCallback((itemValue: string) => {
    if (type === 'multiple') {
      setValue(prev => {
        const newValues = Array.isArray(prev) ? [...prev] : [];
        const index = newValues.indexOf(itemValue);
        if (index > -1) {
          newValues.splice(index, 1);
        } else {
          newValues.push(itemValue);
        }
        return newValues;
      });
    } else {
      setValue(prev => (prev === itemValue && collapsible) ? null : itemValue);
    }
  }, [type, collapsible]);

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({ children, value, className }: { children: ReactNode, value: string, className?: string }) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("overflow-hidden", className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
};

export const AccordionTrigger = ({ children, className, isIconVisible = true }: { children: ReactNode, className?: string, isIconVisible?: boolean }) => {
  const { value: openItems, onValueChange, type } = useAccordion();
  const { value } = useContext(AccordionItemContext);
  
  const isOpen = type === 'multiple' 
    ? Array.isArray(openItems) && openItems.includes(value) 
    : openItems === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn("flex w-full items-center justify-between p-4 font-medium text-left text-text-primary hover:bg-gray-light/20 transition-colors", className)}
    >
      {children}
      {isIconVisible && (
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200', {
            'rotate-180': isOpen,
          })}
        />
      )}
    </button>
  );
};

export const AccordionContent = ({ children }: { children: ReactNode }) => {
  const { value: openItems, type } = useAccordion();
  const { value } = useContext(AccordionItemContext);
  const isOpen = type === 'multiple' 
    ? Array.isArray(openItems) && openItems.includes(value) 
    : openItems === value;

  if (!isOpen) return null;

  return (
    <div className="overflow-hidden">
      {children}
    </div>
  );
};
