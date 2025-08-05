import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  alt, 
  size = 'lg',
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-44 h-44';
      default:
        return 'w-16 h-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-32 w-32';
      default:
        return 'h-8 w-8';
    }
  };

  const getPixelSize = () => {
    switch (size) {
      case 'sm':
        return 32; // 8 * 4 (Tailwind w-8 = 2rem = 32px)
      case 'md':
        return 48; // 12 * 4 (Tailwind w-12 = 3rem = 48px)
      case 'lg':
        return 64; // 16 * 4 (Tailwind w-16 = 4rem = 64px)
      case 'xl':
        return 176; // 44 * 4 (Tailwind w-44 = 11rem = 176px)
      default:
        return 64;
    }
  };

  const optimizeGoogleAvatarUrl = (url: string): string => {
    // Check if it's a Google avatar URL
    if (url.includes('googleusercontent.com') && url.includes('=s')) {
      // Replace the size parameter with our desired size
      const targetSize = getPixelSize();
      return url.replace(/=s\d+(-c)?$/, `=s${targetSize}-c`);
    }
    return url;
  };

  const baseClasses = `${getSizeClasses()} rounded-full object-cover object-center border-2 border-primary-200 bg-gray-100`;

  if (src) {
    const optimizedSrc = optimizeGoogleAvatarUrl(src);
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${baseClasses} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${getSizeClasses()} bg-primary-600 rounded-full flex items-center justify-center ${className}`}>
      <User className={`${getIconSize()} text-white`} />
    </div>
  );
};

export default UserAvatar;