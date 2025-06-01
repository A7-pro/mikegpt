import React from 'react';
import { AI_NAME } from '../constants';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number;
}

const MikeLogo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 32 }) => {
  if (iconOnly) {
    return (
      <div className={`inline-flex items-center ${className}`} style={{ width: size, height: size }}>
        <img 
          src="https://i.ibb.co/JWqqz800/bf10e91ddd3f.jpg" 
          alt={`${AI_NAME} Icon`}
          className="w-full h-full object-contain rounded-full"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img 
        src="https://i.ibb.co/JWqqz800/bf10e91ddd3f.jpg" 
        alt={`${AI_NAME} Logo`}
        className="w-full h-auto object-contain rounded-full mb-2"
        style={{ maxWidth: size * 3, maxHeight: size * 2 }}
      />
      <span 
        className="font-bold text-lg text-amber-600 dark:text-amber-400"
      >
        {AI_NAME}
      </span>
    </div>
  );
};

export default MikeLogo;