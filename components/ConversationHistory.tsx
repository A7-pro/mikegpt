
import React, { useState, useEffect } from 'react';
import { User, UserProfile, STTLanguage, AIVoiceOption } from '../types'; 
import { CREATOR_NAME, CREATOR_LINK, SUPPORTED_STT_LANGUAGES, AVAILABLE_AI_VOICES } from '../constants';
import MikeLogo from './Logo';

interface Conversation {
  id: string;
  name: string;
  messages: any[]; 
  lastUpdated: number;
}

interface UserProfileFormProps {
  profile: UserProfile | null;
  onSave: (updatedProfile: UserProfile) => void;
  disabled?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ profile, onSave, disabled }) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [age, setAge] = useState<string>(profile?.age?.toString() || '');
  const [nationality, setNationality] = useState(profile?.nationality || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName || '');
    setAge(profile?.age?.toString() || '');
    setNationality(profile?.nationality || '');
  }, [profile]);

  const handleSave = () => {
    onSave({
      displayName: displayName.trim() || undefined,
      age: age ? parseInt(age, 10) : undefined,
      nationality: nationality.trim() || undefined,
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setDisplayName(profile?.displayName || '');
    setAge(profile?.age?.toString() || '');
    setNationality(profile?.nationality || '');
    setIsEditing(false);
  };

  if (disabled) {
    return (
      <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg mb-4 bg-slate-100 dark:bg-slate-700/50 shadow-sm opacity-60">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">الملف الشخصي</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">الملف الشخصي غير متاح في وضع الضيف.</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg mb-4 bg-slate-50 dark:bg-slate-700/30 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ملفك الشخصي</h3>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline focus:outline-none"
            aria-label="تعديل الملف الشخصي"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
            </svg>
          </button>
        </div>
        <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
          <p><span className="font-medium text-slate-500 dark:text-slate-400">الاسم:</span> {profile?.displayName || 'لم يحدد'}</p>
          <p><span className="font-medium text-slate-500 dark:text-slate-400">العمر:</span> {profile?.age || 'لم يحدد'}</p>
          <p><span className="font-medium text-slate-500 dark:text-slate-400">الجنسية:</span> {profile?.nationality || 'لم يحدد'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border border-sky-300 dark:border-sky-700 rounded-lg mb-4 bg-sky-50 dark:bg-slate-700/60 shadow-md">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">تعديل الملف الشخصي</h3>
      <div className="space-y-3 text-xs">
        <div>
          <label htmlFor="displayName" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">الاسم ( كيف تحب أناديك؟)</label>
          <input type="text" id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="مثال: أبو عبدالله" className="w-full p-2 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div>
          <label htmlFor="age" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">العمر</label>
          <input type="number" id="age" value={age} onChange={e => setAge(e.target.value)} placeholder="مثال: 30" className="w-full p-2 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
        </div>
        <div>
          <label htmlFor="nationality" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">الجنسية</label>
          <input type="text" id="nationality" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="مثال: سعودي" className="w-full p-2 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
        </div>
      </div>
      <div className="mt-4 flex space-x-2 space-x-reverse">
        <button onClick={handleSave} className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-xs font-semibold transition-colors">حفظ التغييرات</button>
        <button onClick={handleCancel} className="flex-1 py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-md text-xs font-medium transition-colors">إلغاء</button>
      </div>
    </div>
  );
};

interface VoiceSettingsProps {
  sttLanguage: string;
  onSttLanguageChange: (langValue: string) => void;
  
  availableTTSVoices: SpeechSynthesisVoice[]; // For standard TTS
  selectedTTSVoiceURI: string | null; // For standard TTS
  onTtsVoiceChange: (voiceURI: string) => void; // For standard TTS
  
  isTTSEnabled: boolean; // Standard TTS
  onToggleTTS: () => void; // Standard TTS
  
  isLiveTTSEnabled: boolean; // Live TTS
  onToggleLiveTTS: () => void; // Live TTS
  
  selectedAIVoiceURI: string; // For Live TTS voice selection
  onAIVoiceURIChange: (voiceURI: string) => void; // For Live TTS voice selection

  autoListenEnabled: boolean;
  onToggleAutoListen: () => void;
  speechSynthesisSupported: boolean;
  speechRecognitionSupported: boolean;
  webAudioSupported: boolean; // For live TTS capability
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  sttLanguage, onSttLanguageChange,
  availableTTSVoices, selectedTTSVoiceURI, onTtsVoiceChange,
  isTTSEnabled, onToggleTTS,
  isLiveTTSEnabled, onToggleLiveTTS,
  selectedAIVoiceURI, onAIVoiceURIChange,
  autoListenEnabled, onToggleAutoListen,
  speechSynthesisSupported, speechRecognitionSupported, webAudioSupported
}) => {
  if (!speechSynthesisSupported && !speechRecognitionSupported && !webAudioSupported) {
    return null; 
  }

  return (
    <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg mb-4 bg-slate-50 dark:bg-slate-700/30 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">إعدادات الصوت والتفاعل</h3>
      <div className="space-y-3 text-xs">
        {webAudioSupported && (
            <>
            <div className="flex items-center justify-between">
              <label htmlFor="liveTtsToggle" className="text-slate-600 dark:text-slate-300 font-medium">
                النطق المباشر (تجريبي)
                <span className="block text-[10px] text-slate-400 dark:text-slate-500">تفعيل للاتصال الصوتي أو الردود السريعة.</span>
              </label>
              <button
                id="liveTtsToggle"
                onClick={onToggleLiveTTS}
                disabled={!webAudioSupported}
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-700/30 focus:ring-sky-500 ${isLiveTTSEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-500'} ${!webAudioSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={isLiveTTSEnabled}
                title={!webAudioSupported ? "النطق المباشر غير مدعوم في متصفحك" : (isLiveTTSEnabled ? "إيقاف النطق المباشر" : "تفعيل النطق المباشر")}
              >
                <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isLiveTTSEnabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
              </button>
            </div>
            {isLiveTTSEnabled && (
                 <div>
                    <label htmlFor="aiVoiceSelect" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">صوت مايك (للنطق المباشر/الاتصال)</label>
                    <select
                        id="aiVoiceSelect"
                        value={selectedAIVoiceURI}
                        onChange={(e) => onAIVoiceURIChange(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    >
                        {AVAILABLE_AI_VOICES.map(voice => (
                            <option key={voice.uri} value={voice.uri}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                 </div>
            )}
            </>
        )}

        {speechSynthesisSupported && ( 
          <>
            <div className="flex items-center justify-between">
              <label htmlFor="ttsToggle" className="text-slate-600 dark:text-slate-300 font-medium">الرد الصوتي القياسي (TTS)</label>
              <button
                id="ttsToggle"
                onClick={onToggleTTS}
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-700/30 focus:ring-sky-500 ${isTTSEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-500'}`}
                role="switch"
                aria-checked={isTTSEnabled}
              >
                <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isTTSEnabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
              </button>
            </div>
            {isTTSEnabled && (
              <div>
                <label htmlFor="ttsVoice" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">صوت مايك (TTS القياسي)</label>
                {availableTTSVoices.length > 0 ? (
                    <>
                        <select 
                        id="ttsVoice" 
                        value={selectedTTSVoiceURI || ''} 
                        onChange={e => onTtsVoiceChange(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                        {availableTTSVoices.map(voice => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                            </option>
                        ))}
                        </select>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            الأصوات المعروضة مقدمة من متصفحك/نظامك.
                        </p>
                    </>
                ) : (
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        لا توجد أصوات TTS قياسية متاحة من متصفحك.
                    </p>
                )}
              </div>
            )}
          </>
        )}
        {speechRecognitionSupported && (
          <>
            <div>
              <label htmlFor="sttLanguage" className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">لغة الإدخال الصوتي (STT)</label>
              <select 
                id="sttLanguage" 
                value={sttLanguage} 
                onChange={e => onSttLanguageChange(e.target.value)}
                className="w-full p-1.5 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                {SUPPORTED_STT_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="autoListenToggle" className="text-slate-600 dark:text-slate-300 font-medium">الاستماع التلقائي بعد رد مايك</label>
              <button
                id="autoListenToggle"
                onClick={onToggleAutoListen}
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-700/30 focus:ring-sky-500 ${autoListenEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-500'}`}
                role="switch"
                aria-checked={autoListenEnabled}
              >
                <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${autoListenEnabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


interface ConversationHistoryProps extends Omit<VoiceSettingsProps, 'availableTTSVoices' | 'selectedTTSVoiceURI' | 'onTtsVoiceChange' | 'isTTSEnabled' | 'onToggleTTS' | 'speechSynthesisSupported'> {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onLogout: () => void;
  currentUser: User | null;
  isGuest: boolean;
  userProfile: UserProfile | null;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  // For Standard TTS (still needed if user disables live TTS)
  availableTTSVoices: SpeechSynthesisVoice[];
  selectedTTSVoiceURI: string | null;
  onTtsVoiceChange: (voiceURI: string) => void;
  isTTSEnabled: boolean; 
  onToggleTTS: () => void; 
  speechSynthesisSupported: boolean;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onLogout,
  currentUser,
  isGuest,
  userProfile,
  onSaveProfile,
  // Voice settings props
  sttLanguage, onSttLanguageChange,
  selectedAIVoiceURI, onAIVoiceURIChange, // For live TTS AI voice
  isLiveTTSEnabled, onToggleLiveTTS,
  autoListenEnabled, onToggleAutoListen,
  speechRecognitionSupported, webAudioSupported,
  // Standard TTS props
  availableTTSVoices, selectedTTSVoiceURI: stdSelectedTTSVoiceURI, onTtsVoiceChange: stdOnTtsVoiceChange,
  isTTSEnabled: stdIsTTSEnabled, onToggleTTS: stdOnToggleTTS, speechSynthesisSupported: stdSpeechSynthesisSupported
}) => {
  return (
    <div className="h-full flex flex-col p-3 sm:p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
      <div className="mb-4 text-center">
        <MikeLogo className="justify-center" size={32}/>
        {(currentUser && !isGuest) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                أهلًا بك، <span className="font-medium">{userProfile?.displayName || currentUser.username}</span>
                {currentUser.isAdmin && <span className="text-xs text-sky-500 dark:text-sky-400 font-semibold"> (مطور)</span>}
            </p>
        )}
        {isGuest && (
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                أنت تتصفح كـ<span className="font-semibold">زائر</span>
            </p>
        )}
      </div>
      
      <UserProfileForm profile={userProfile} onSave={onSaveProfile} disabled={isGuest} />
      
      <VoiceSettings 
        sttLanguage={sttLanguage} onSttLanguageChange={onSttLanguageChange}
        
        availableTTSVoices={availableTTSVoices} 
        selectedTTSVoiceURI={stdSelectedTTSVoiceURI} 
        onTtsVoiceChange={stdOnTtsVoiceChange}
        isTTSEnabled={stdIsTTSEnabled} 
        onToggleTTS={stdOnToggleTTS}
        
        isLiveTTSEnabled={isLiveTTSEnabled} 
        onToggleLiveTTS={onToggleLiveTTS}
        selectedAIVoiceURI={selectedAIVoiceURI} 
        onAIVoiceURIChange={onAIVoiceURIChange}
        
        autoListenEnabled={autoListenEnabled} 
        onToggleAutoListen={onToggleAutoListen}
        speechSynthesisSupported={stdSpeechSynthesisSupported} 
        speechRecognitionSupported={speechRecognitionSupported}
        webAudioSupported={webAudioSupported}
      />

      <button
        onClick={onNewConversation}
        className="w-full mb-3 p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500 text-sm flex items-center justify-center shadow-sm hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        {isGuest ? 'بدء محادثة ضيف جديدة' : 'محادثة جديدة'}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 px-1 font-medium">
        {isGuest ? 'محادثتك الحالية:' : 'محادثاتك السابقة:'}
      </p>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1 mb-3 custom-scrollbar">
        {conversations.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
            {isGuest ? 'ابدأ محادثة جديدة!' : 'لا توجد محادثات محفوظة بعد.'}
            </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 group flex justify-between items-center text-sm
                        ${currentConversationId === conv.id 
                          ? 'bg-sky-100 dark:bg-sky-700 text-sky-700 dark:text-sky-200 font-semibold shadow-inner' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:shadow-sm'
                        }`}
          >
            <span className="truncate flex-1 pr-2 rtl:pl-2 rtl:pr-0">{conv.name}</span>
            {!isGuest && ( 
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  if (window.confirm(`هل أنت متأكد أنك تريد حذف محادثة "${conv.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                    onDeleteConversation(conv.id);
                  }
                }}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="حذف المحادثة"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4.5h8V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4.5 6 4.5v9.75A1.75 1.75 0 0 0 7.75 16h4.5A1.75 1.75 0 0 0 14 14.25V4.5h-4ZM4.5 4.5V3.75c0-.966.784-1.75 1.75-1.75h1.5V1.525a3.25 3.25 0 0 1-3.25 3.25V14.25a3.25 3.25 0 0 0 3.25 3.25h4.5a3.25 3.25 0 0 0 3.25-3.25V4.775a3.25 3.25 0 0 1-3.25-3.25V2h1.5c.966 0 1.75.784 1.75 1.75V4.5h1.75a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 0 0 1.5H4.5Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
         <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-2">
            تطوير <a href={CREATOR_LINK} target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-500 dark:hover:text-sky-300">{CREATOR_NAME}</a>
        </p>
        <button
          onClick={onLogout}
          className="w-full p-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-500 text-sm flex items-center justify-center shadow-sm hover:shadow-md"
        >
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 0 10.75 3.5h-5.5A.75.75 0 0 0 4.5 4.25v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M16.78 9.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L14.94 10 11.47 6.53a.75.75 0 0 1 1.06-1.06l4.25 4.25Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.75 10a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 6.75 10Z" clipRule="evenodd" />
          </svg>
          {isGuest ? 'تسجيل الدخول / مستخدم جديد' : 'تسجيل الخروج'}
        </button>
      </div>
    </div>
  );
};

export default ConversationHistory;