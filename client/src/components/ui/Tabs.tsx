import {
  createContext,
  useContext,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  idBase: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`<Tabs.${component}> must be used within <Tabs>`);
  }
  return context;
}

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const idBase = useId();
  const activeValue = value ?? internalValue;

  const setValue = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue, idBase }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const { idBase } = useTabsContext("List");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const container = event.currentTarget;
    const triggers = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const currentIndex = triggers.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + triggers.length) % triggers.length;
    triggers[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      id={`${idBase}-list`}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-brand-border bg-white p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: activeValue, setValue, idBase } = useTabsContext("Trigger");
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${idBase}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${idBase}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm font-semibold text-brand-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/40",
        isActive ? "text-white" : "hover:text-brand-text",
        className,
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`${idBase}-active-pill`}
          className="absolute inset-0 rounded-full bg-brand-primary"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: activeValue, idBase } = useTabsContext("Content");
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${value}`}
      aria-labelledby={`${idBase}-tab-${value}`}
      tabIndex={0}
      className={cn("mt-4 focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
