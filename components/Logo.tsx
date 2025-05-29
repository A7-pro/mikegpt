
// components/Logo.tsx
import React from 'react';
import { AI_NAME } from '../constants';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number; // If iconOnly, this is icon height. If full logo, this is overall height.
}

const MikeLogo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 32 }) => {
  // Colors picked from the user-provided logo image
  const mikeTextColor = "#2B86E4"; 
  const bubbleBgColor = "#F9A03F"; 
  const contentInBubbleColor = "#FFFFFF"; // For "AI" and bars

  if (iconOnly) {
    // Icon only: ViewBox for the icon itself (bubble is approx 56x42 relative units)
    const iconViewBoxWidth = 56;
    const iconViewBoxHeight = 42;
    // Calculate actual width and height based on 'size' (which refers to height for iconOnly)
    const iconWidth = size * (iconViewBoxWidth / iconViewBoxHeight);
    const iconHeight = size;

    return (
      <div className={`inline-flex items-center ${className}`} style={{ width: iconWidth, height: iconHeight }}>
        <svg 
          viewBox={`0 0 ${iconViewBoxWidth} ${iconViewBoxHeight}`}
          width={iconWidth}
          height={iconHeight}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          aria-label={`${AI_NAME} Logo Icon`}
        >
          {/* Speech bubble shape (path crafted to resemble the logo) */}
          <path 
            d={`M3.5 2C2.67157 2 2 2.67157 2 3.5V25.5C2 26.3284 2.67157 27 3.5 27H20.5L23.5 31.5L26.5 27H${iconViewBoxWidth - 3.5}C${iconViewBoxWidth - 2.6716} 27 ${iconViewBoxWidth - 2} 26.3284 ${iconViewBoxWidth - 2} 25.5V3.5C${iconViewBoxWidth - 2} 2.67157 ${iconViewBoxWidth - 2.6716} 2 ${iconViewBoxWidth - 3.5} 2H3.5Z`}
            fill={bubbleBgColor} 
          />
          {/* Bars - positions relative to iconViewBox */}
          <rect x={iconViewBoxWidth * 0.16} y={iconViewBoxHeight * 0.20} width={iconViewBoxWidth * 0.075} height={iconViewBoxHeight * 0.45} rx="1.5" fill={contentInBubbleColor} />
          <rect x={iconViewBoxWidth * 0.28} y={iconViewBoxHeight * 0.32} width={iconViewBoxWidth * 0.075} height={iconViewBoxHeight * 0.26} rx="1.5" fill={contentInBubbleColor} />
          <rect x={iconViewBoxWidth * 0.40} y={iconViewBoxHeight * 0.20} width={iconViewBoxWidth * 0.075} height={iconViewBoxHeight * 0.45} rx="1.5" fill={contentInBubbleColor} />
          {/* AI Text - positions relative to iconViewBox */}
          <text 
            x={iconViewBoxWidth * 0.73} 
            y={iconViewBoxHeight * 0.46} // Adjusted for better vertical centering
            fontFamily="Arial, Helvetica, sans-serif" 
            fontSize={iconViewBoxHeight * 0.33} 
            fontWeight="bold" 
            fill={contentInBubbleColor} 
            textAnchor="middle"
            dominantBaseline="central"
          >
            AI
          </text>
        </svg>
      </div>
    );
  }

  // Full Logo: Icon above Text "Mike"
  // 'size' prop controls total height of the full logo.
  // Define overall viewBox (e.g., width 100, height 80 for a slightly wider than tall logo)
  const viewBoxWidth = 100; // Arbitrary unit for viewBox width
  const viewBoxHeight = 75;  // Arbitrary unit for viewBox height (making overall logo aspect ratio 100:75)
  
  const displayWidth = size * (viewBoxWidth / viewBoxHeight);
  const displayHeight = size;

  // Icon dimensions and position within the full logo's viewBox
  const iconInFullLogoInternalHeight = viewBoxHeight * 0.45; // Icon part takes up 45% of the total viewBox height
  const iconInFullLogoInternalWidth = 56 * (iconInFullLogoInternalHeight / 42); // Maintain icon's own aspect ratio (56/42)
  const iconX = (viewBoxWidth - iconInFullLogoInternalWidth) / 2; // Center icon horizontally
  const iconY = viewBoxHeight * 0.05; // Small top margin for the icon

  // "Mike" Text dimensions and position
  const mikeTextY = viewBoxHeight * 0.77; // Y position for "Mike" text (lower part of viewBox)
  const mikeTextFontSize = viewBoxHeight * 0.32; // Font size for "Mike"

  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ width: displayWidth, height: displayHeight }}>
      <svg 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width={displayWidth}
        height={displayHeight}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        aria-label={`${AI_NAME} Logo`}
      >
        {/* Icon Group - translated and scaled to fit its allocated space in full logo */}
        {/* The <g> element scales the icon's internal coordinate system (0,0 to 56,42) */}
        <g transform={`translate(${iconX}, ${iconY}) scale(${iconInFullLogoInternalHeight / 42})`}>
          {/* Icon's own drawing, assuming its native viewBox is 56x42 */}
          <path 
            d={`M3.5 2C2.67157 2 2 2.67157 2 3.5V25.5C2 26.3284 2.67157 27 3.5 27H20.5L23.5 31.5L26.5 27H${56 - 3.5}C${56 - 2.6716} 27 ${56 - 2} 26.3284 ${56 - 2} 25.5V3.5C${56 - 2} 2.67157 ${56 - 2.6716} 2 ${56 - 3.5} 2H3.5Z`}
            fill={bubbleBgColor} 
          />
          <rect x={56 * 0.16} y={42 * 0.20} width={56 * 0.075} height={42 * 0.45} rx="1.5" fill={contentInBubbleColor} />
          <rect x={56 * 0.28} y={42 * 0.32} width={56 * 0.075} height={42 * 0.26} rx="1.5" fill={contentInBubbleColor} />
          <rect x={56 * 0.40} y={42 * 0.20} width={56 * 0.075} height={42 * 0.45} rx="1.5" fill={contentInBubbleColor} />
          <text 
            x={56 * 0.73} 
            y={42 * 0.46}
            fontFamily="Arial, Helvetica, sans-serif" 
            fontSize={42 * 0.33} 
            fontWeight="bold" 
            fill={contentInBubbleColor} 
            textAnchor="middle"
            dominantBaseline="central"
          >
            AI
          </text>
        </g>
        
        {/* "Mike" Text */}
        <text 
          x={viewBoxWidth / 2} 
          y={mikeTextY} 
          fontFamily="Arial, Helvetica, sans-serif" // Using a generic bold sans-serif font
          fontSize={mikeTextFontSize} 
          fontWeight="bold" 
          fill={mikeTextColor} 
          textAnchor="middle"
          dominantBaseline="middle" // Adjusted for better vertical centering of text
        >
          {AI_NAME}
        </text>
      </svg>
    </div>
  );
};

export default MikeLogo;