import React from 'react';
import UserAvatar from './UserAvatar';

interface UserInfoProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  planType?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ 
  name, 
  email, 
  avatarUrl, 
  planType = 'Free Plan' 
}) => {
  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <UserAvatar 
        src={avatarUrl} 
        alt={name} 
        size="xl"
      />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        {email && (
          <p className="text-primary-600 text-sm font-medium">{email}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800 font-medium">
            {planType}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;