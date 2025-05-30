import React from 'react';

interface VoiceInputButtonProps {
  isListening: boolean;
  onToggleListen: () => void;
  disabled?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ isListening, onToggleListen, disabled }) => {
  // Enhanced button styles with better visual feedback
  const buttonBaseStyles = `
    p-2.5 sm:p-3 rounded-xl transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-offset-white dark:focus:ring-offset-slate-800 
    transform hover:scale-105 active:scale-95
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const buttonActiveStyles = isListening
    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 text-white shadow-red-500/50 focus:ring-red-500'
    : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 dark:from-sky-600 dark:to-sky-700 text-white shadow-sky-500/50 focus:ring-sky-500';

  return (
    <button
      type="button"
      onClick={onToggleListen}
      disabled={disabled}
      className={`${buttonBaseStyles} ${buttonActiveStyles} shadow-lg hover:shadow-xl`}
      aria-label={isListening ? "إيقاف التسجيل الصوتي" : "بدء التسجيل الصوتي"}
      title={disabled ? "التسجيل الصوتي غير متاح حالياً" : (isListening ? "إيقاف التسجيل" : "ابدأ التسجيل")}
    >
      {isListening ? (
        <svg xmlns="http://www.w3.org/2000/svg\" viewBox="0 0 24 24\" fill="currentColor" 
             className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse">
          <path d="M12 14.5a2.5 2.5 0 0 1-2.5-2.5V6.5a2.5 2.5 0 0 1 5 0v5.5a2.5 2.5 0 0 1-2.5 2.5Z" />
          <path d="M8.5 6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1.717L13.207 5H12a4.5 4.5 0 0 0-4.5 4.5v.5a.5.5 0 0 1-1 0v-.5A5.506 5.506 0 0 1 12 4h1.207l-4.414 4.414A3.485 3.485 0 0 0 7.5 9.5v2a3.485 3.485 0 0 0 .293 1.393L6.386 14.3A5.486 5.486 0 0 1 6 12v-2.5A3.504 3.504 0 0 1 9.5 6H8.5Z" />
          <path d="M17 12a5.506 5.506 0 0 1-5.5 5.5A5.506 5.506 0 0 1 6 12H5a7 7 0 0 0 6.168 6.925A.504.504 0 0 1 11.5 19.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .332-.475A6.984 6.984 0 0 0 5 12h-.5a.5.5 0 0 1 0-1H5a7.008 7.008 0 0 0 7-7V3.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4c2.021 0 3.81.833 5.114 2.162l-1.43 1.348A4.486 4.486 0 0 0 12 6.003a4.49 4.49 0 0 0-4.384 3.586L9.05 11.02A2.5 2.5 0 0 1 9.5 12h.043l1.468 1.468A2.487 2.487 0 0 1 9.5 12a2.5 2.5 0 0 1 2.5-2.5c.231 0 .454.032.668.091L14.1 8.158A3.488 3.488 0 0 0 12 7.5a3.5 3.5 0 0 0-3.5 3.5v1A3.5 3.5 0 0 0 12 15.5a3.486 3.486 0 0 0 2.293-.842l1.321 1.321A5.486 5.486 0 0 1 12 17.5a5.506 5.506 0 0 1-5.5-5.5H7a.5.5 0 0 1 0 1h-.5Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
             className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M12 14.5a2.5 2.5 0 0 1-2.5-2.5V6.5a2.5 2.5 0 0 1 5 0v5.5a2.5 2.5 0 0 1-2.5 2.5Z" />
          <path d="M17 12a5 5 0 0 1-5 5 5 5 0 0 1-5-5H5a7 7 0 0 0 6.168 6.925A.504.504 0 0 1 11.5 19.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .332-.475A6.984 6.984 0 0 0 5 12V9.5a.5.5 0 0 1 1 0V12a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-2.5a.5.5 0 0 1 1 0V12Z" />
        </svg>
      )}
    </button>
  );
};

export default VoiceInputButton;