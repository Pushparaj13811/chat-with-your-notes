import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!isAuthenticated) {
    return (
      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.picture;

  return (
    <button
      onClick={handleProfileClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors w-full"
    >
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover object-center bg-gray-100"
            loading="lazy"
          />
        ) : (
          <div className="h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {displayName}
        </span>
      </div>
    </button>
  );
};

export default UserProfile;