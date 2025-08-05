import React from 'react';
import { Trash2 } from 'lucide-react';

interface DangerZoneProps {
  onDeleteAccount?: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

const DangerZone: React.FC<DangerZoneProps> = ({
  onDeleteAccount,
  title = 'Danger Zone',
  description = 'Permanently delete your account and all associated data.',
  buttonText = 'Delete Account'
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-red-600">{title}</h3>
      <p className="text-sm text-red-700 mb-4">
        {description}
      </p>
      <button 
        onClick={onDeleteAccount}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-custom-sm"
      >
        <Trash2 className="h-4 w-4" />
        {buttonText}
      </button>
    </div>
  );
};

export default DangerZone;