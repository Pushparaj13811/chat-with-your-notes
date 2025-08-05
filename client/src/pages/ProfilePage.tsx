import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import reusable components
import {
  ProfileHeader,
  UserInfo,
  MessageUsageCard,
  KeyboardShortcutsCard,
  NavigationTabs,
  UpgradeCard,
  DangerZone
} from '../components/profile';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToChat = () => {
    navigate('/');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Delete account clicked');
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade flow
    console.log('Upgrade clicked');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.picture;

  // Mock data for message usage
  const messageUsage = {
    current: 0,
    total: 20,
    remaining: 20,
    resetTime: 'Resets tomorrow at 5:29 AM'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-primary-200">
      <div className='max-w-6xl mx-auto'>
        <ProfileHeader
          onBackClick={handleBackToChat}
          onLogout={handleLogout}
        />
      </div>
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="">
              <UserInfo
                name={displayName}
                email={user?.email}
                avatarUrl={avatarUrl}
                planType="Free Plan"
              />

              <MessageUsageCard usage={messageUsage} />

              <KeyboardShortcutsCard />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <NavigationTabs />

            <UpgradeCard onUpgradeClick={handleUpgrade} />

            <DangerZone onDeleteAccount={handleDeleteAccount} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;