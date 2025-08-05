import React, { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-20 h-20';
      case 'lg':
        return 'w-32 h-32';
      case 'xl':
        return 'w-64 h-64';
      default:
        return 'w-32 h-32';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-10 h-10';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-32 h-32';
      default:
        return 'w-16 h-16';
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
    if (!url) return url;
    
    // Check if it's a Google avatar URL
    if (url.includes('googleusercontent.com')) {
      const targetSize = getPixelSize();
      
      // Handle different Google URL formats
      if (url.includes('=s')) {
        // Standard format: https://lh3.googleusercontent.com/a/ABC=s96-c
        return url.replace(/=s\d+(-c)?(-no)?$/, `=s${targetSize}-c`);
      } else if (url.includes('/s')) {
        // Alternative format: https://lh3.googleusercontent.com/a/ABC/s96-c
        return url.replace(/\/s\d+(-c)?(-no)?$/, `/s${targetSize}-c`);
      } else {
        // Add size parameter if missing
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}sz=${targetSize}`;
      }
    }
    return url;
  };

  const handleImageError = () => {
    if (!useProxy && src?.includes('googleusercontent.com')) {
      // Try using proxy as fallback for Google images
      setUseProxy(true);
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const getImageSrc = (originalSrc: string): string => {
    if (useProxy && originalSrc.includes('googleusercontent.com')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(originalSrc)}`;
    }
    return optimizeGoogleAvatarUrl(originalSrc);
  };

  const baseClasses = `${getSizeClasses()} rounded-full object-cover object-center border-2 border-primary-200 bg-gray-100`;

  if (src && !imageError) {
    const imageSrc = getImageSrc(src);
    return (
      <div className={`${getSizeClasses()} relative ${className}`}>
        <img
          key={useProxy ? 'proxy' : 'direct'} // Force re-render when switching modes
          src={imageSrc}
          alt={alt}
          className={`${baseClasses} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          crossOrigin={useProxy ? undefined : "anonymous"} // Don't use crossOrigin for proxy
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {!imageLoaded && (
          <div className={`${getSizeClasses()} absolute inset-0 bg-primary-600 rounded-full flex items-center justify-center`}>
            <User className={`${getIconSize()} text-white animate-pulse`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${getSizeClasses()} bg-primary-600 rounded-full flex items-center justify-center ${className}`}>
      <User className={`${getIconSize()} text-white`} />
    </div>
  );
};

export default UserAvatar;