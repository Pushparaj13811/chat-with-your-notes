import React from 'react';

interface ProfileCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  children, 
  className = '',
  noPadding = false 
}) => {
  const baseClasses = 'bg-white/80 backdrop-blur-sm rounded-xl border border-primary-200/30';
  const paddingClasses = noPadding ? '' : 'p-6';
  
  return (
    <div className={`${baseClasses} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ProfileCard;