import React, { createContext, useContext, ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionContextProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
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

export const Accordion = ({ children, value: controlledValue, onValueChange, className, type, collapsible }: { children: ReactNode, value?: string | null, onValueChange?: (value: string | null) => void, className?: string, type?: 'single', collapsible?: boolean }) => {
  const [internalValue, setInternalValue] = useState<string | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const handleValueChange = isControlled ? onValueChange : setInternalValue;

  return (
    <AccordionContext.Provider value={{ value: value || null, onValueChange: handleValueChange || (() => {}) }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({ children, value }: { children: ReactNode, value: string }) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className="border-b border-gray-light last:border-b-0">{children}</div>
    </AccordionItemContext.Provider>
  );
};

export const AccordionTrigger = ({ children, className, isIconVisible = true }: { children: ReactNode, className?: string, isIconVisible?: boolean }) => {
  const { value: openItem, onValueChange } = useAccordion();
  const { value } = useContext(AccordionItemContext);
  const isOpen = openItem === value;

  const handleToggle = () => {
    onValueChange(isOpen ? null : value);
  };

  return (
    <button
      onClick={handleToggle}
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
  const { value: openItem } = useAccordion();
  const { value } = useContext(AccordionItemContext);
  const isOpen = openItem === value;

  if (!isOpen) return null;

  return (
    <div className="overflow-hidden bg-gray-dark/50">
      {children}
    </div>
  );
};