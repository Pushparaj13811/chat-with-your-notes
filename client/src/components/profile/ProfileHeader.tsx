import React from 'react';
import { ArrowLeft, Sun } from 'lucide-react';

interface ProfileHeaderProps {
  onBackClick: () => void;
  onLogout: () => void;
  onThemeToggle?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  onBackClick, 
  onLogout, 
  onThemeToggle 
}) => {
  return (
    <div className="flex items-center justify-between p-6">
      <button
        onClick={onBackClick}
        className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Chat
      </button>
      
      <div className="flex items-center gap-4">
        {onThemeToggle && (
          <button 
            onClick={onThemeToggle}
            className="p-2 rounded-lg hover:bg-primary-100/50 transition-colors text-primary-600"
          >
            <Sun className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;