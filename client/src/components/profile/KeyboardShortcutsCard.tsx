import React from 'react';
import { Keyboard } from 'lucide-react';
import ProfileCard from './ProfileCard';

interface KeyboardShortcut {
  label: string;
  keys: string[];
}

interface KeyboardShortcutsCardProps {
  shortcuts?: KeyboardShortcut[];
}

const defaultShortcuts: KeyboardShortcut[] = [
  { label: 'Search', keys: ['⌘', 'K'] },
  { label: 'New Chat', keys: ['⌘', 'Shift', 'O'] },
  { label: 'Toggle Sidebar', keys: ['⌘', 'B'] },
];

const KeyboardShortcutsCard: React.FC<KeyboardShortcutsCardProps> = ({ 
  shortcuts = defaultShortcuts 
}) => {
  return (
    <ProfileCard className="mt-10">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
        <Keyboard className="h-5 w-5 text-primary-600" />
        Keyboard Shortcuts
      </h3>
      
      <div className="space-y-3">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-medium">{shortcut.label}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <kbd 
                  key={keyIndex}
                  className="px-2 py-1 text-xs bg-primary-100/70 rounded border border-primary-300/50 text-primary-800 font-medium"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  );
};

export default KeyboardShortcutsCard;