
import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types';
import ChatMessageComponent from './ChatMessage';
import VoiceInputButton from './VoiceInputButton'; // Re-use for in-call voice input
import { AI_NAME } from '../constants';
import MikeLogo from './Logo'; // For AI avatar

interface CallScreenProps {
  messages: ChatMessage[];
  callStatus: string;
  onEndCall: () => void;
  onSendMessage: (text: string) => void; // For sending text messages during call
  userInput: string;
  setUserInput: (input: string) => void;
  isListening: boolean;
  onToggleListen: () => void;
  isLoading: boolean; // To disable input while AI is "thinking" or processing
  currentAiMessageIdForLiveAudio: string | null;
  onSpeakText: (text: string) => void; // For manually speaking a message
}

const CallScreen: React.FC<CallScreenProps> = ({
  messages,
  callStatus,
  onEndCall,
  onSendMessage,
  userInput,
  setUserInput,
  isListening,
  onToggleListen,
  isLoading,
  currentAiMessageIdForLiveAudio,
  onSpeakText
}) => {
  const callChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    callChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter(msg => !msg.id.startsWith('announcement-'));

  return (
    <div className="fixed inset-0 bg-slate-800 dark:bg-slate-950 z-40 flex flex-col text-white p-4">
      {/* Call Header */}
      <div className="flex flex-col items-center py-6 border-b border-slate-700">
        <MikeLogo iconOnly={true} size={60} className="mb-3"/>
        <h2 className="text-2xl font-semibold">{AI_NAME}</h2>
        <p className="text-sm text-sky-400">{callStatus}</p>
      </div>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto py-4 space-y-4">
        <div className="max-w-xl mx-auto w-full">
          {filteredMessages.map((msg) => (
            <ChatMessageComponent 
              key={msg.id} 
              message={msg} 
              onSpeak={msg.sender === MessageSender.AI && msg.id !== currentAiMessageIdForLiveAudio ? onSpeakText : undefined} // Allow speaking previous messages
            />
          ))}
        </div>
        <div ref={callChatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="py-3 border-t border-slate-700">
        <div className="max-w-xl mx-auto w-full">
          <form
            onSubmit={(e) => { e.preventDefault(); if(userInput.trim()) onSendMessage(userInput); }}
            className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse"
          >
            <VoiceInputButton 
              onToggleListen={onToggleListen} 
              isListening={isListening} 
              disabled={isLoading} 
            />
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isListening ? "جاري الاستماع..." : (isLoading ? `${AI_NAME} يتحدث أو يفكر...` : "اكتب رسالتك...")}
              className="flex-1 p-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition duration-150 bg-slate-700 text-slate-100 placeholder-slate-400 text-sm sm:text-base"
              disabled={isLoading || isListening}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              aria-label="إرسال"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 transform rtl:scale-x-[-1]"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
            </button>
          </form>
        </div>
      </footer>

      {/* End Call Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={onEndCall}
          className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-slate-800 focus:ring-red-500"
          aria-label="إنهاء المكالمة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 2.255l-1.293.97c-.135.101-.164.279-.088.401A11.187 11.187 0 0 0 7.89 15.15l.622.311a2.251 2.251 0 0 0 1.994.118l2.832-1.281a1.875 1.875 0 0 1 2.115 1.194l1.362 4.084c.298.893.223 1.87-.217 2.631a3.002 3.002 0 0 1-2.245 1.358H6.872A3 3 0 0 1 3.872 18H3.75A2.25 2.25 0 0 1 1.5 15.75V4.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CallScreen;