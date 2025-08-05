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
        return 'w-12 h-12';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 w-32';
      case 'xl':
        return 'w-64 h-64';
      default:
        return 'w-32 h-32';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 w-32';
      case 'xl':
        return 'w-64 h-64';
      default:
        return 'w-32 h-32';
    }
  };

  const getPixelSize = () => {
    switch (size) {
      case 'sm':
        return 48; // 8 * 4 (Tailwind w-8 = 2rem = 32px)
      case 'md':
        return 80; // 12 * 4 (Tailwind w-12 = 3rem = 48px)
      case 'lg':
        return 128; // 16 * 4 (Tailwind w-16 = 4rem = 64px)
      case 'xl':
        return 256; // 44 * 4 (Tailwind w-44 = 11rem = 176px)
      default:
        return 128;
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