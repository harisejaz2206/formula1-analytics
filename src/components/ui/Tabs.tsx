import React from 'react';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            activeTab,
            onTabChange: setActiveTab
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className,
  activeTab,
  onTabChange 
}) => {
  return (
    <div className={`f1-tabs-list ${className || ''}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isActive: child.props.value === activeTab,
            onClick: () => onTabChange?.(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  className,
  isActive,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`f1-tab-trigger ${isActive ? 'f1-tab-trigger-active' : 'f1-tab-trigger-idle'} ${className || ''}`}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children,
  className,
  activeTab 
}) => {
  if (value !== activeTab) return null;
  
  return (
    <div className={`animate-fade-in-up ${className || ''}`}>
      {children}
    </div>
  );
};
