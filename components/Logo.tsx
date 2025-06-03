import React from 'react';
import { AI_NAME } from '../constants';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number;
}

const RoayaLogo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 32 }) => {
  const primaryColor = "#2C5282";
  const accentColor = "#4299E1";
  
  if (iconOnly) {
    return (
      <div className={`inline-flex items-center ${className}`} style={{ width: size, height: size }}>
        <img 
          src="/roaya-icon.png" 
          alt={`${AI_NAME} Icon`}
          className="w-full h-full object-contain"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img 
        src="/roaya-logo.png" 
        alt={`${AI_NAME} Logo`}
        className="w-full h-auto object-contain mb-2"
        style={{ maxWidth: size * 3, maxHeight: size * 2 }}
      />
      <span 
        className="font-bold text-lg"
        style={{ color: primaryColor }}
      >
        {AI_NAME}
      </span>
    </div>
  );
};

export default RoayaLogo;