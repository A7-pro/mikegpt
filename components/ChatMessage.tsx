
import React from 'react';
import { ChatMessage as ChatMessageProps, MessageSender, MessageType, GroundingChunk } from '../types';
import { AI_NAME } from '../constants';

// Enhanced User Icon
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-500 dark:bg-sky-600 text-white flex items-center justify-center shadow-md ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  </div>
);

// Enhanced AI Icon (Mike)
const AIIcon: React.FC<{ className?: string }> = ({ className }) => (
 <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center shadow-md ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" opacity=".7"/>
      <path d="M16.5 7.5c0-2.485-2.015-4.5-4.5-4.5S7.5 5.015 7.5 7.5 9.515 12 12 12s4.5-2.015 4.5-4.5zm-2.5-1c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z M12 13.5c-3.315 0-6 2.015-6 4.5h12c0-2.485-2.685-4.5-6-4.5zm-3.5 2c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm7 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z" />
    </svg>
  </div>
);

// System Icon
const SystemIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-400 dark:bg-sky-500 text-white flex items-center justify-center shadow-md ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.921 1.544l-.261.865A7.469 7.469 0 0 0 7.028 6.51l-.887-.188c-.95-.202-1.898.459-1.953 1.407l-.054.943a7.5 7.5 0 0 0 .399 2.77l.293.849c.241.698.95.999 1.666.791l.865-.261A7.469 7.469 0 0 0 10.49 14.97l-.188.887c-.202.95.459 1.898 1.407 1.953l.943.054a7.5 7.5 0 0 0 2.77-.399l.849-.293c.698-.241.999-.95.791-1.666l-.261-.865A7.469 7.469 0 0 0 14.97 10.49l.887.188c.95.202 1.898-.459 1.953-1.407l.054-.943a7.5 7.5 0 0 0-.399-2.77l-.293-.849c-.241-.698-.95-.999-1.666-.791l-.865.261A7.469 7.469 0 0 0 13.49 7.028l.188-.887c.202-.95-.459-1.898-1.407-1.953l-.943-.054A7.486 7.486 0 0 0 11.078 2.25ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" clipRule="evenodd" />
    </svg>
  </div>
);


interface Props {
  message: ChatMessageProps;
  onSpeak?: (text: string) => void;
}

const ChatMessageComponent: React.FC<Props> = ({ message, onSpeak }) => {
  const isUser = message.sender === MessageSender.USER;
  const isAI = message.sender === MessageSender.AI;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const messageTime = new Date(message.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const renderTextContent = (text: string) => {
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>'); 
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>'); 
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>'); 
    
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```|```([\s\S]*?)```/g, (match, lang, code1, code2) => {
        const code = code1 || code2;
        const languageClass = lang ? `language-${lang}` : '';
        const escapedCode = code.replace(/<br \/>/g, '\n');
        return `<pre class="bg-slate-200 dark:bg-slate-700 p-3 rounded-md my-1.5 text-sm overflow-x-auto whitespace-pre-wrap break-all ${languageClass}"><code>${escapedCode}</code></pre>`;
    });
    
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-500 dark:text-sky-300 hover:underline">$1</a>');
    html = html.replace(/\n/g, '<br />');
    
    let textColorClass = "";
    if (isAI) {
      textColorClass = "text-slate-800 dark:text-slate-100";
    } else if (isSystem) {
      textColorClass = message.type === MessageType.ERROR 
        ? "text-red-700 dark:text-red-200" 
        : "text-sky-700 dark:text-sky-200";
    }

    return <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${textColorClass}`} dangerouslySetInnerHTML={{ __html: html }} />;
  };


  const getBubbleStyles = () => {
    if (isUser) {
      return 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-t-2xl rounded-l-2xl dark:from-sky-600 dark:to-sky-700 shadow-lg';
    }
    if (isSystem) {
      if (message.type === MessageType.ERROR) {
        return 'bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 rounded-xl shadow-md';
      }
      return 'bg-sky-100 dark:bg-sky-800/70 border border-sky-200 dark:border-sky-700/70 rounded-xl shadow-md text-xs';
    }
    return 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-t-2xl rounded-r-2xl shadow-lg';
  };

  const alignmentClasses = isUser ? 'justify-end' : 'justify-start';
  const itemOrderClasses = isUser ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={`flex ${alignmentClasses} mb-4 sm:mb-6 w-full`}>
      <div className={`flex ${itemOrderClasses} items-end max-w-[85%] sm:max-w-[80%]`}>
        {!isUser && (
          <div className="mr-2 sm:mr-3 self-end rtl:ml-2 rtl:mr-0 sm:rtl:ml-3">
            {isAI && <AIIcon />}
            {isSystem && <SystemIcon />}
          </div>
        )}
        {isUser && (
          <div className="ml-2 sm:ml-3 self-end rtl:mr-2 rtl:ml-0 sm:rtl:mr-3">
            <UserIcon />
          </div>
        )}

        <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${getBubbleStyles()}`}>
          <div className="flex justify-between items-center mb-0.5">
            <div>
              {!isUser && !isSystem && <p className="text-xs font-semibold text-green-600 dark:text-green-400">{AI_NAME}</p>}
              {isSystem && <p className={`text-xs font-semibold ${message.type === MessageType.ERROR ? 'text-red-600 dark:text-red-300' : 'text-sky-600 dark:text-sky-300'}`}>النظام</p>}
            </div>
            {isAI && message.text && onSpeak && (
              <button 
                onClick={() => onSpeak(message.text!)} 
                className="p-1 text-slate-500 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-300 focus:outline-none"
                aria-label="نطق الرسالة"
                title="نطق الرسالة"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.5H4.25a.75.75 0 0 0 0 1.5h2V7.5a.75.75 0 0 0 1.5 0v-1.5h2a.75.75 0 0 0 0-1.5h-2V2.75Z" />
                  <path fillRule="evenodd" d="M5.057 9.22a.75.75 0 0 1 .671.966 5.5 5.5 0 0 0 8.544 0 .75.75 0 1 1 1.342-.638 7 7 0 0 1-11.228 0 .75.75 0 0 1 .671-.966ZM10 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0-1.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {message.sender === MessageSender.USER && message.uploadedImagePreviewUrl && (
            <div className="mb-1.5">
              <img 
                src={message.uploadedImagePreviewUrl} 
                alt="Uploaded for analysis"
                className="rounded-lg max-w-xs h-auto max-h-64 object-contain border border-slate-300 dark:border-slate-500 shadow-sm" 
              />
            </div>
          )}

          {message.text && renderTextContent(message.text)}
          
          {message.type === MessageType.IMAGE && message.imageUrl && (
             <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
                <img 
                  src={message.imageUrl} 
                  alt={`Generated by ${AI_NAME}`}
                  className="rounded-lg max-w-full h-auto max-h-96 object-contain border border-slate-300 dark:border-slate-500 shadow-sm hover:shadow-lg transition-shadow duration-200" 
                />
              </a>
          )}
          
          {message.type === MessageType.LOADING && message.text && (
             <div className={`flex items-center text-sm sm:text-base ${isAI ? "text-slate-700 dark:text-slate-200" : isSystem ? "text-sky-700 dark:text-sky-200" : ""}`}>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 rtl:ml-2 rtl:mr-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {message.text}
            </div>
          )}

          {message.type === MessageType.TEXT && message.sender === MessageSender.AI && message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-500/50">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">مصادر:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5 marker:text-slate-400 dark:marker:text-slate-500">
                {message.groundingChunks.map((chunk, index) => (
                  chunk.web && chunk.web.uri && ( 
                    <li key={index} className="truncate">
                      <a 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sky-600 dark:text-sky-400 hover:underline"
                        title={chunk.web.title || chunk.web.uri}
                      >
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
          <p className={`text-xs mt-1.5 text-right rtl:text-left ${
            isUser ? 'text-sky-100 dark:text-sky-300 opacity-80' 
                   : isAI ? 'text-slate-400 dark:text-slate-500' 
                          : (message.type === MessageType.ERROR ? 'text-red-400 dark:text-red-500' : 'text-sky-500 dark:text-sky-400 opacity-90')
          }`}>
            {messageTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;