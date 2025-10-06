import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsContextProps {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | null>(null);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a <Tabs> component");
  }
  return context;
};

const Tabs = ({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ selectedValue, setSelectedValue }}>
      <div data-orientation="horizontal" className="flex flex-col h-full">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-light/50 p-1 text-text-secondary",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(({ className, value, ...props }, ref) => {
  const { selectedValue, setSelectedValue } = useTabs();
  const isSelected = selectedValue === value;

  return (
    <button
      ref={ref}
      onClick={() => setSelectedValue(value)}
      data-state={isSelected ? 'active' : 'inactive'}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-gray-dark text-text-primary shadow-sm",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, value, ...props }, ref) => {
    const { selectedValue } = useTabs();
    
    if (value !== selectedValue) return null;

    return (
        <div
            ref={ref}
            className={cn("flex-grow overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
            {...props}
        />
    )
});
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent };