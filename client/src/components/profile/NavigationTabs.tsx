import React from 'react';
import ProfileCard from './ProfileCard';

interface Tab {
  id: string;
  label: string;
  active?: boolean;
}

interface NavigationTabsProps {
  tabs?: Tab[];
  onTabClick?: (tabId: string) => void;
}

const defaultTabs: Tab[] = [
  { id: 'account', label: 'Account', active: true },
  { id: 'customization', label: 'Customization' },
  { id: 'history', label: 'History & Sync' },
  { id: 'models', label: 'Models' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'contact', label: 'Contact Us' },
];

const NavigationTabs: React.FC<NavigationTabsProps> = ({ 
  tabs = defaultTabs, 
  onTabClick 
}) => {
  return (
    <ProfileCard noPadding className="p-1">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabClick?.(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab.active
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-primary-700 hover:text-primary-800 hover:bg-primary-50/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </ProfileCard>
  );
};

export default NavigationTabs;