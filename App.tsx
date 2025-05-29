
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, MessageSender, MessageType, GroundingChunk, User, UserProfile, PersonalityTemplate, GlobalAnnouncement, STTLanguage, AIVoiceOption } from './types';
import ChatMessageComponent from './components/ChatMessage';
import VoiceInputButton from './components/VoiceInputButton';
import { generateTextStream, generateImage, resetChat as resetGeminiChatSession, updateChatSystemInstruction, startLiveAudioSession, sendToLiveAudioSession, closeLiveAudioSession, isLiveAudioSessionActive } from './services/geminiService';
import { AI_NAME, CREATOR_NAME, CREATOR_LINK, INITIAL_GREETING, VOICE_COMMAND_START, SYSTEM_INSTRUCTION, MAX_CONVERSATIONS_TO_KEEP, PROFILE_PROMPT_MESSAGE, ADMIN_EMAIL, SUPPORTED_STT_LANGUAGES, GUEST_USER_ID, GUEST_USERNAME, LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX, AVAILABLE_AI_VOICES, AI_VOICE_DEFAULT_URI, LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX, CALL_GREETING_USER_INITIATED } from './constants';
import AuthForm from './components/AuthForm';
import ConversationHistory from './components/ConversationHistory';
import MikeLogo from './components/Logo';
import AdminChoiceModal from './components/AdminChoiceModal';
import AdminPanel from './components/AdminPanel';
import { AudioLivePlayer } from './utils/audioLivePlayer';
import CallScreen from './components/CallScreen';


interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognitionResultItem { isFinal: boolean; readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResultItem; [index: number]: SpeechRecognitionResultItem; }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message: string; }
interface SpeechRecognitionInstance extends EventTarget { continuous: boolean; lang: string; interimResults: boolean; maxAlternatives: number; grammars: any; serviceURI?: string; onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null; onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null; onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null; start(): void; stop(): void; abort(): void; }
interface SpeechRecognitionConstructor { new(): SpeechRecognitionInstance; }
declare global { interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor; AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext; } }

const SpeechRecognitionAPIConstructor: SpeechRecognitionConstructor | undefined = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition: SpeechRecognitionInstance | null = null;

if (SpeechRecognitionAPIConstructor) {
    recognition = new SpeechRecognitionAPIConstructor();
    recognition.continuous = false; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
} else {
    console.warn("Speech Recognition API not supported in this browser.");
}


interface Conversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [showAdminChoiceModal, setShowAdminChoiceModal] = useState<boolean>(false);
  const [adminViewActive, setAdminViewActive] = useState<boolean>(false);
  
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false); // Standard TTS
  const [isLiveTTSEnabled, setIsLiveTTSEnabled] = useState<boolean>(false); // Live streaming TTS / Call mode
  const [selectedAIVoiceURI, setSelectedAIVoiceURI] = useState<string>(AI_VOICE_DEFAULT_URI); // For live TTS / Call voice
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedTTSVoiceURI, setSelectedTTSVoiceURI] = useState<string | null>(null); // For standard TTS

  const [sttLanguage, setSttLanguage] = useState<string>(SUPPORTED_STT_LANGUAGES[0].value); 
  const [autoListenAfterMike, setAutoListenAfterMike] = useState<boolean>(false);

  const [selectedImageForUpload, setSelectedImageForUpload] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [globalAnnouncement, setGlobalAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState<boolean>(false);

  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>(""); // e.g., "Connecting...", "Connected", "Call Ended"

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<AudioLivePlayer | null>(null);
  const currentAiMessageIdForLiveAudioRef = useRef<string | null>(null);


  const getUserIdForStorage = useCallback(() => {
    return isGuest ? GUEST_USER_ID : currentUser?.id || null;
  }, [currentUser, isGuest]);

  useEffect(() => {
    if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioPlayerRef.current = new AudioLivePlayer(audioContextRef.current);
    } else {
        console.warn("Web Audio API not supported in this browser. Live TTS will be disabled.");
    }
    
    if (process.env.API_KEY && process.env.API_KEY !== "MISSING_API_KEY") {
      setApiKeyExists(true);
    } else {
      setApiKeyExists(false);
      addMessage(MessageSender.SYSTEM, MessageType.ERROR, "عفوًا، يبدو أن مفتاح الواجهة البرمجية (API Key) غير مهيأ. يرجى التأكد من تهيئته بشكل صحيح. لا يمكنني العمل بدون المفتاح.", undefined, `error-apikey-${Date.now()}`);
    }

    if ('speechSynthesis' in window) {
        setSpeechSynthesisSupported(true);
        const utterance = new SpeechSynthesisUtterance();
        utteranceRef.current = utterance;
        
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            if (!selectedTTSVoiceURI && voices.length > 0) {
                const arabicVoice = voices.find(v => v.lang.startsWith('ar-'));
                if (arabicVoice) {
                    setSelectedTTSVoiceURI(arabicVoice.voiceURI);
                    if (utteranceRef.current) utteranceRef.current.voice = arabicVoice;
                } else {
                     if (utteranceRef.current) utteranceRef.current.lang = 'ar-SA'; 
                }
            }
        };
        loadVoices(); 
        window.speechSynthesis.onvoiceschanged = loadVoices; 
    } else {
        console.warn("Speech Synthesis API not supported in this browser.");
    }

    if (recognition) {
        recognition.lang = sttLanguage;
    }

    return () => { 
        audioPlayerRef.current?.stopAndClear();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        closeLiveAudioSession();
    };
  }, []); 

  useEffect(() => {
    const storedUserJson = localStorage.getItem('mikeCurrentUser');
    if (storedUserJson) {
      const storedUser: User = JSON.parse(storedUserJson);
      setCurrentUser(storedUser); 
      setIsGuest(false);
    }
  }, []);


  useEffect(() => {
    const userId = getUserIdForStorage();
    if (!userId) return; 
    
    const ttsPref = localStorage.getItem(`mikeTTSEnabled_${userId}`);
    if (ttsPref) setIsTTSEnabled(JSON.parse(ttsPref));

    const liveTtsPref = localStorage.getItem(`${LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX}${userId}`);
    if (liveTtsPref) setIsLiveTTSEnabled(JSON.parse(liveTtsPref));
    else setIsLiveTTSEnabled(false); 

    const aiVoicePref = localStorage.getItem(`${LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX}${userId}`);
    setSelectedAIVoiceURI(aiVoicePref || AI_VOICE_DEFAULT_URI);

    const sttLangPref = localStorage.getItem(`mikeSTTLang_${userId}`);
    if (sttLangPref) setSttLanguage(sttLangPref);
    
    const ttsVoicePref = localStorage.getItem(`mikeTTSVoiceURI_${userId}`); // Standard TTS voice
    if (ttsVoicePref) setSelectedTTSVoiceURI(ttsVoicePref);

    const autoListenPref = localStorage.getItem(`mikeAutoListen_${userId}`);
    if (autoListenPref) setAutoListenAfterMike(JSON.parse(autoListenPref));


    if (currentUser && !isGuest) { 
        loadUserProfile(currentUser.id);
        if (currentUser.email === ADMIN_EMAIL) {
            const adminChoiceMade = localStorage.getItem('mikeAdminChoiceMade');
            if (!adminChoiceMade) setShowAdminChoiceModal(true);
            else if (adminChoiceMade === 'admin') setAdminViewActive(true);
        }
    }

    const announcementJson = localStorage.getItem('mikeGlobalAnnouncement');
    if (announcementJson) {
        const announcement: GlobalAnnouncement = JSON.parse(announcementJson);
        const dismissedAnnouncementsJson = localStorage.getItem(`mikeDismissedAnnouncements_${userId}`);
        const dismissedAnnouncements: string[] = dismissedAnnouncementsJson ? JSON.parse(dismissedAnnouncementsJson) : [];
        if (announcement.id && !dismissedAnnouncements.includes(announcement.id)) {
            setGlobalAnnouncement(announcement);
            setShowAnnouncementBanner(true);
        }
    }
  }, [currentUser, isGuest, getUserIdForStorage]);


  useEffect(() => {
    let profileInfoBlock = "";
    if (currentUser && !isGuest && userProfile) { 
      const { displayName, age, nationality } = userProfile;
      if (displayName || age || nationality) {
        profileInfoBlock = "معلومات المستخدم الحالية التي يمكنك استخدامها لتخصيص الحوار:\n";
        if (displayName) profileInfoBlock += `- الاسم الذي يفضله المستخدم: ${displayName}\n`;
        if (age) profileInfoBlock += `- العمر: ${age}\n`;
        if (nationality) profileInfoBlock += `- الجنسية: ${nationality}\n`;
        profileInfoBlock += "استخدم هذه المعلومات بشكل طبيعي ولطيف في ردودك عند الحاجة. إذا لم تكن المعلومة متوفرة، لا تشر إليها.\n---\n";
      }
    }
    const newDynamicInstruction = SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", profileInfoBlock);
    updateChatSystemInstruction(newDynamicInstruction);
  }, [userProfile, currentUser, isGuest]);


  useEffect(() => {
    const userId = getUserIdForStorage();

    if (userId && apiKeyExists && (!currentUser || (currentUser && !showAdminChoiceModal && !adminViewActive))) {
        if (!isGuest && currentUser) { 
            loadConversations(userId);
            const lastActiveId = localStorage.getItem(`mikeLastActiveConv_${userId}`);
            if (lastActiveId) {
                loadConversation(lastActiveId); 
            } else {
                startNewConversation(); 
            }
            if (!userProfile?.displayName && !userProfile?.age && !userProfile?.nationality) {
                setTimeout(() => {
                    const currentProfile = JSON.parse(localStorage.getItem(`mikeUserProfile_${userId}`) || '{}');
                    const isChatEssentiallyEmpty = messages.length === 0 || (messages.length === 1 && (messages[0].text === INITIAL_GREETING || messages[0].id.startsWith('announcement-')));
                    if (!currentProfile.displayName && !currentProfile.age && !currentProfile.nationality && isChatEssentiallyEmpty && !messages.some(msg => msg.text === PROFILE_PROMPT_MESSAGE(currentUser.username))) {
                        addMessage(MessageSender.SYSTEM, MessageType.TEXT, PROFILE_PROMPT_MESSAGE(currentUser.username));
                    }
                }, 2000);
            }
        } else if (isGuest) { 
            const guestConv = localStorage.getItem(`mikeConversations_${GUEST_USER_ID}`);
            if (guestConv) {
                const guestConversations: Conversation[] = JSON.parse(guestConv);
                if (guestConversations.length > 0) {
                    loadConversation(guestConversations[0].id); 
                } else {
                    startNewConversation();
                }
            } else {
              startNewConversation();
            }
        }
    } else if ((!currentUser && !isGuest) || (currentUser && adminViewActive)) { 
        setMessages([]);
        setConversations([]);
        setCurrentConversationId(null);
        if(!currentUser && !isGuest) setUserProfile(null); 
        if (currentUser && adminViewActive) {  }
        else { setShowAdminChoiceModal(false); setAdminViewActive(false); }
        
        if (!currentUser && !isGuest) localStorage.removeItem('mikeAdminChoiceMade');
        
        if (currentUser && adminViewActive) {  }
        else { setGlobalAnnouncement(null); setShowAnnouncementBanner(false); }
    }
  }, [currentUser, isGuest, apiKeyExists, showAdminChoiceModal, adminViewActive, getUserIdForStorage]); 
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const userId = getUserIdForStorage();
    if (!userId || adminViewActive || messages.length === 0 || isCallActive) return; // Don't save during active call if messages are temporary for call UI

    setConversations(prevConvs => {
        if (!currentConversationId) return prevConvs; 

        let updatedConversations = [...prevConvs];
        const convIndex = prevConvs.findIndex(c => c.id === currentConversationId);
        const currentMessagesToSave = messages.filter(msg => !msg.id.startsWith('announcement-'));

        if (convIndex !== -1) {
            const currentConv = updatedConversations[convIndex];
            currentConv.messages = currentMessagesToSave;
            currentConv.lastUpdated = Date.now();
            const firstMeaningfulMessage = currentMessagesToSave.find(m => m.sender === MessageSender.USER && m.text) || currentMessagesToSave.find(m => m.sender === MessageSender.AI && m.text && m.text !== INITIAL_GREETING);
            if ((currentConv.name === "محادثة جديدة" || currentConv.name.startsWith("محادثة ضيف")) && firstMeaningfulMessage?.text) {
                currentConv.name = firstMeaningfulMessage.text.substring(0, 30) + (firstMeaningfulMessage.text.length > 30 ? "..." : "");
            }
        } else {
            let newName = isGuest ? `محادثة ضيف ${new Date().toLocaleTimeString('ar-SA')}` : "محادثة جديدة";
            const firstMeaningfulMessage = currentMessagesToSave.find(m => m.sender === MessageSender.USER && m.text) || currentMessagesToSave.find(m => m.sender === MessageSender.AI && m.text && m.text !== INITIAL_GREETING);
            if (firstMeaningfulMessage?.text) {
                newName = firstMeaningfulMessage.text.substring(0, 30) + (firstMeaningfulMessage.text.length > 30 ? "..." : "");
            }
            const newConv: Conversation = { id: currentConversationId, name: newName, messages: currentMessagesToSave, lastUpdated: Date.now() };
            updatedConversations.push(newConv);
        }

        updatedConversations.sort((a, b) => b.lastUpdated - a.lastUpdated);
        if (!isGuest && updatedConversations.length > MAX_CONVERSATIONS_TO_KEEP) {
            updatedConversations = updatedConversations.slice(0, MAX_CONVERSATIONS_TO_KEEP);
        } else if (isGuest && updatedConversations.length > 1) { 
             updatedConversations = [updatedConversations[0]]; 
        }
        localStorage.setItem(`mikeConversations_${userId}`, JSON.stringify(updatedConversations));
        return updatedConversations;
    });
  }, [messages, currentConversationId, currentUser, isGuest, adminViewActive, getUserIdForStorage, isCallActive]);

  const loadUserProfile = (userId: string) => {
    if (isGuest) return;
    const storedProfile = localStorage.getItem(`mikeUserProfile_${userId}`);
    setUserProfile(storedProfile ? JSON.parse(storedProfile) : null);
  };

  const saveUserProfile = (profile: UserProfile) => {
    const userId = getUserIdForStorage();
    if (userId && !isGuest && currentUser) {
      setUserProfile(profile);
      localStorage.setItem(`mikeUserProfile_${currentUser.id}`, JSON.stringify(profile));
    }
  };

  const loadConversations = (userId: string) => {
    const storedConvs = localStorage.getItem(`mikeConversations_${userId}`);
    if (storedConvs) {
      const parsedConvs: Conversation[] = JSON.parse(storedConvs);
      parsedConvs.sort((a, b) => b.lastUpdated - a.lastUpdated); 
      setConversations(parsedConvs);
      return parsedConvs;
    }
    setConversations([]);
    return [];
  };
  
  const startNewConversation = () => {
    const userId = getUserIdForStorage();
    if (!userId) return;

    audioPlayerRef.current?.stopAndClear();
    if(isLiveAudioSessionActive()) closeLiveAudioSession();
    if(isCallActive) setIsCallActive(false); // End call if starting new conv

    let profileInfoBlock = "";
    if (currentUser && !isGuest && userProfile) {
      profileInfoBlock = `معلومات المستخدم الحالية: الاسم: ${userProfile.displayName || 'غير محدد'}, العمر: ${userProfile.age || 'غير محدد'}, الجنسية: ${userProfile.nationality || 'غير محدد'}.\n---\n`;
    }
    const newDynamicInstruction = SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", profileInfoBlock);
    resetGeminiChatSession(newDynamicInstruction);

    const newConvId = `conv-${Date.now()}`;
    const initialMsg: ChatMessage = { id: `initial-${Date.now()}`, sender: MessageSender.AI, type: MessageType.TEXT, text: INITIAL_GREETING, timestamp: Date.now() };
    setMessages([initialMsg]); 
    setCurrentConversationId(newConvId); 
    
    const newConvName = isGuest ? `محادثة ضيف` : "محادثة جديدة";
    const newConversation: Conversation = { id: newConvId, name: newConvName, messages: [initialMsg], lastUpdated: Date.now() };

    setConversations(prevConvs => {
        let updated = [newConversation, ...prevConvs];
        updated.sort((a, b) => b.lastUpdated - a.lastUpdated);
        if (!isGuest && updated.length > MAX_CONVERSATIONS_TO_KEEP) {
            updated = updated.slice(0, MAX_CONVERSATIONS_TO_KEEP);
        } else if (isGuest) { 
            updated = [newConversation]; 
        }
        localStorage.setItem(`mikeConversations_${userId}`, JSON.stringify(updated));
        return updated;
    });

    if (!isGuest && currentUser) {
        localStorage.setItem(`mikeLastActiveConv_${userId}`, newConvId);
    }
    setIsSidebarOpen(false);
  };

  const loadConversation = (convId: string) => {
    const userId = getUserIdForStorage();
    if (!userId) return;

    audioPlayerRef.current?.stopAndClear();
    if(isLiveAudioSessionActive()) closeLiveAudioSession();
    if(isCallActive) setIsCallActive(false); // End call if loading conv

    const convsFromStorage = JSON.parse(localStorage.getItem(`mikeConversations_${userId}`) || '[]') as Conversation[];
    const conv = convsFromStorage.find(c => c.id === convId);

    if (conv) {
      let profileInfoBlock = "";
      if (currentUser && !isGuest && userProfile) {
        profileInfoBlock = `معلومات المستخدم الحالية: الاسم: ${userProfile.displayName || 'غير محدد'}, العمر: ${userProfile.age || 'غير محدد'}, الجنسية: ${userProfile.nationality || 'غير محدد'}.\n---\n`;
      }
      const newDynamicInstruction = SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", profileInfoBlock);
      resetGeminiChatSession(newDynamicInstruction);
      
      let loadedMessages = conv.messages;
      if (globalAnnouncement?.id && showAnnouncementBanner && !loadedMessages.some(m => m.id === `announcement-${globalAnnouncement.id}`)) {
          const announcementMsg: ChatMessage = { id: `announcement-${globalAnnouncement.id}`, sender: MessageSender.SYSTEM, type: MessageType.TEXT, text: `📢 **إعلان:** ${globalAnnouncement.message}`, timestamp: globalAnnouncement.timestamp };
          loadedMessages = [announcementMsg, ...loadedMessages];
      }
      setMessages(loadedMessages);
      setCurrentConversationId(conv.id);
      if (!isGuest && currentUser) {
          localStorage.setItem(`mikeLastActiveConv_${userId}`, convId);
      }
    } else {
        startNewConversation();
    }
    setIsSidebarOpen(false);
  };

  const deleteConversation = (convId: string) => {
    const userId = getUserIdForStorage();
    if (!userId || isGuest) return; 

    setConversations(prev => {
        const updated = prev.filter(c => c.id !== convId);
        localStorage.setItem(`mikeConversations_${userId}`, JSON.stringify(updated));
        return updated;
    });
    if (currentConversationId === convId) {
        startNewConversation();
    }
  };
  
  const addMessage = (sender: MessageSender, type: MessageType, text?: string, imageUrl?: string, idOverride?: string, groundingChunks?: GroundingChunk[], uploadedImagePreviewUrl?: string, isImageQuery?: boolean): string => {
    const messageId = idOverride || `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setMessages(prev => {
        if (idOverride?.startsWith('announcement-') && prev.some(msg => msg.id === idOverride)) return prev;

        const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
        let newMessages;
        if (existingMessageIndex !== -1) { 
            newMessages = [...prev];
            const currentMsg = newMessages[existingMessageIndex];
            newMessages[existingMessageIndex] = {
                ...currentMsg,
                text: text !== undefined ? text : currentMsg.text, 
                imageUrl: imageUrl !== undefined ? imageUrl : currentMsg.imageUrl, 
                type: type, 
                timestamp: Date.now(),
                groundingChunks: groundingChunks !== undefined ? groundingChunks : currentMsg.groundingChunks,
                uploadedImagePreviewUrl: uploadedImagePreviewUrl !== undefined ? uploadedImagePreviewUrl : currentMsg.uploadedImagePreviewUrl,
                isImageQuery: isImageQuery !== undefined ? isImageQuery : currentMsg.isImageQuery,
            };
        } else {
            newMessages = [...prev, { id: messageId, sender, type, text, imageUrl, timestamp: Date.now(), groundingChunks, uploadedImagePreviewUrl, isImageQuery }];
        }

        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.id === messageId && sender === MessageSender.AI && type === MessageType.TEXT && text && isTTSEnabled && !isLiveTTSEnabled && !isCallActive) {
            speakMessage(text);
        }
        return newMessages;
    });
    return messageId;
  };
  
  const handleSendMessage = useCallback(async (text: string, isCallInitialization = false) => {
    const userId = getUserIdForStorage();
    if ((!text.trim() && !selectedImageForUpload && !isCallInitialization) || isLoading || !apiKeyExists || !userId) return;

    if (speechSynthesisSupported && !isCallActive) window.speechSynthesis.cancel(); // Stop standard TTS if not in call
    // If in call, live audio player handles its own stream.

    let imagePayload: { mimeType: string, data: string } | undefined = undefined;
    const userMessageText = text; 

    if (selectedImageForUpload && !isCallActive) { // Image upload only if not in call
        const currentFile = selectedImageForUpload; 
        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(currentFile);
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = (error) => {
                  console.error("FileReader error:", error);
                  reject(new Error("فشل في قراءة الصورة."));
                };
            });
            imagePayload = { mimeType: currentFile.type, data: base64Data };
        } catch (error) {
            addMessage(MessageSender.SYSTEM, MessageType.ERROR, (error as Error).message || "فشل في معالجة الصورة.");
            clearSelectedImage(); 
            return; 
        }
    }
    
    if (!isCallInitialization) { // Don't add user message if it's a system-initiated call greeting
        addMessage(MessageSender.USER, MessageType.TEXT, userMessageText, undefined, undefined, undefined, imagePayload ? selectedImagePreviewUrl : undefined, !!imagePayload);
    }
    setUserInput('');
    const previewUrlForAIMessage = selectedImagePreviewUrl; 
    clearSelectedImage();

    setIsLoading(true);
    const aiMessageId = addMessage(MessageSender.AI, MessageType.LOADING, isCallActive ? "يتحدث..." : "لحظات أفكر لك...", undefined);
    currentAiMessageIdForLiveAudioRef.current = aiMessageId;


    if (!imagePayload && (userMessageText.toLowerCase().includes("مين سواك") || userMessageText.toLowerCase().includes("who made you") || userMessageText.toLowerCase().includes("من صنعك"))) {
      const creatorResponse = `مطوري هو ${CREATOR_NAME}، الله يعطيه العافية ويبارك في جهوده! هو اللي علمني كل شي. أنا لم أطور من قبل أي شركة، بل تم تطويري بالكامل بواسطته.`;
      addMessage(MessageSender.AI, MessageType.TEXT, creatorResponse, undefined, aiMessageId);
      setIsLoading(false);
      return;
    }

    if (!imagePayload && (userMessageText.toLowerCase().includes("امسح الشات") || userMessageText.toLowerCase().includes("clear chat") || userMessageText.toLowerCase().includes("ابدأ من جديد"))) {
        startNewConversation(); 
        setIsLoading(false);
        return;
    }
    
    const imageKeywords = ["ارسم", "صورة لـ", "صمم لي", "draw", "image of", "generate image", "create an image of"];
    const isImageGenerationRequest = !imagePayload && !isCallActive && imageKeywords.some(keyword => userMessageText.toLowerCase().startsWith(keyword) || userMessageText.toLowerCase().includes(keyword));

    if (isImageGenerationRequest) {
      if (isLiveAudioSessionActive()) closeLiveAudioSession(); 
      let prompt = userMessageText;
      imageKeywords.forEach(keyword => { 
        const regex = new RegExp(`^${keyword}\\s*`, 'i'); 
        prompt = prompt.replace(regex, '').replace(new RegExp(keyword, 'gi'), '').trim();
      });
      
      addMessage(MessageSender.AI, MessageType.LOADING, `أبشر! جاري رسم "${prompt || 'طلبك'}"...`, undefined, aiMessageId);
      const { imageUrl, error } = await generateImage(prompt || "صورة فنية مذهلة"); 
      if (imageUrl) {
        addMessage(MessageSender.AI, MessageType.IMAGE, `تفضل، هذي الصورة طلبتها خصيصًا لك${prompt ? `: "${prompt}"` : ''}`, imageUrl, aiMessageId);
      } else {
        addMessage(MessageSender.AI, MessageType.ERROR, error || "ماقدرت أرسم الصورة، ممكن تجرب طلب ثاني؟", undefined, aiMessageId);
      }
      setIsLoading(false);
    } else if ((isLiveTTSEnabled || isCallActive) && audioPlayerRef.current && !imagePayload) { 
        let accumulatedTextForLive = "";
        const currentAIMsgId = currentAiMessageIdForLiveAudioRef.current || aiMessageId;

        const sessionStarted = await startLiveAudioSession(
            selectedAIVoiceURI, // Use selected AI voice
            (textChunk, isPartial) => { 
                if (isPartial) {
                    accumulatedTextForLive += textChunk;
                    addMessage(MessageSender.AI, MessageType.TEXT, accumulatedTextForLive, undefined, currentAIMsgId);
                } else { 
                    addMessage(MessageSender.AI, MessageType.TEXT, accumulatedTextForLive.trim() || " ", undefined, currentAIMsgId);
                }
            },
            (audioData, mimeType) => { 
                if (!audioPlayerRef.current?.isActive()) { 
                    audioPlayerRef.current?.setFormat(mimeType);
                }
                audioPlayerRef.current?.addChunk(audioData);
            },
            () => { // onTurnComplete
                setIsLoading(false);
                if (isCallActive) setCallStatus("متصل");
                if (autoListenAfterMike && SpeechRecognitionAPIConstructor && recognition && (isCallActive || isLiveTTSEnabled)) {
                    if (!isListening) toggleListen(true);
                }
            },
            (error) => { 
                addMessage(MessageSender.AI, MessageType.ERROR, error, undefined, currentAIMsgId);
                setIsLoading(false);
                if (isCallActive) {
                    setCallStatus("فشل الاتصال");
                    // Consider auto-ending call or allowing retry. For now, just update status.
                }
                closeLiveAudioSession(); 
            }
        );

        if (sessionStarted) {
            addMessage(MessageSender.AI, MessageType.TEXT, isCallActive ? "يتصل..." : "...", undefined, currentAIMsgId); 
            await sendToLiveAudioSession(
                userMessageText, // This is the actual user prompt or the initial call greeting
                (textChunk, isPartial) => { 
                    if (isPartial) {
                        accumulatedTextForLive += textChunk;
                        addMessage(MessageSender.AI, MessageType.TEXT, accumulatedTextForLive, undefined, currentAIMsgId);
                    } else {
                        addMessage(MessageSender.AI, MessageType.TEXT, accumulatedTextForLive.trim() || " ", undefined, currentAIMsgId);
                    }
                },
                (audioData, mimeType) => { 
                    if (!audioPlayerRef.current?.isActive() || !audioPlayerRef.current['pcmFormat']) { 
                       audioPlayerRef.current?.setFormat(mimeType);
                    }
                    audioPlayerRef.current?.addChunk(audioData);
                }
            );
        } else {
             addMessage(MessageSender.AI, MessageType.ERROR, "لم أتمكن من بدء جلسة الصوت المباشر.", undefined, currentAIMsgId);
            setIsLoading(false);
            if (isCallActive) setCallStatus("فشل الاتصال");
        }

    } else { 
      if (isLiveAudioSessionActive()) closeLiveAudioSession(); 
      let fullResponseText = "";
      let responseGroundingChunks : GroundingChunk[] | undefined = undefined;

      generateTextStream(
        userMessageText,
        (textChunk, isFinal, groundingChunks) => {
            if (!isFinal && textChunk) {
                fullResponseText += textChunk;
                if (groundingChunks) responseGroundingChunks = groundingChunks;
                addMessage(MessageSender.AI, MessageType.TEXT, fullResponseText, undefined, aiMessageId, responseGroundingChunks, imagePayload ? previewUrlForAIMessage : undefined);
            } else if (isFinal) {
                const finalText = fullResponseText.trim().length > 0 ? fullResponseText 
                                : (responseGroundingChunks?.length ? " " : "عفوًا، لم أجد ردًا مناسبًا أو أن الرد كان فارغًا.");
                addMessage(MessageSender.AI, MessageType.TEXT, finalText, undefined, aiMessageId, responseGroundingChunks, imagePayload ? previewUrlForAIMessage : undefined);
                setIsLoading(false);
                 if (autoListenAfterMike && SpeechRecognitionAPIConstructor && recognition && isTTSEnabled && !isLiveTTSEnabled && !isCallActive) {
                    // Standard TTS handles its own auto-listen on utterance.onend
                    // but if TTS is off, we might need to trigger here.
                    // For simplicity, standard TTS onend handles this.
                 }
            }
        },
        (error) => {
            addMessage(MessageSender.AI, MessageType.ERROR, error, undefined, aiMessageId);
            setIsLoading(false);
        },
        imagePayload 
      );
    }
  }, [isLoading, apiKeyExists, getUserIdForStorage, messages, currentConversationId, userProfile, isTTSEnabled, isLiveTTSEnabled, isCallActive, selectedAIVoiceURI, speechSynthesisSupported, autoListenAfterMike, selectedImageForUpload, selectedImagePreviewUrl]); 

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 4 * 1024 * 1024) { 
            addMessage(MessageSender.SYSTEM, MessageType.ERROR, "حجم الصورة كبير جدًا. الرجاء اختيار صورة أصغر من 4 ميجابايت.");
            if (imageInputRef.current) imageInputRef.current.value = ""; 
            return;
        }
        setSelectedImageForUpload(file);
        setSelectedImagePreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const clearSelectedImage = () => {
      setSelectedImageForUpload(null);
      setSelectedImagePreviewUrl(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const speakMessage = (text: string) => { 
    if (isLiveTTSEnabled || isCallActive) return; 
    if (speechSynthesisSupported && utteranceRef.current && apiKeyExists) {
      window.speechSynthesis.cancel();
      audioPlayerRef.current?.stopAndClear(); 

      utteranceRef.current.text = text;
      
      const selectedVoice = availableVoices.find(v => v.voiceURI === selectedTTSVoiceURI);
      if (selectedVoice) {
          utteranceRef.current.voice = selectedVoice;
          utteranceRef.current.lang = selectedVoice.lang; 
      } else { 
          utteranceRef.current.lang = /[a-zA-Z]/.test(text.substring(0, 50)) ? 'en-US' : 'ar-SA';
      }
      
      utteranceRef.current.onend = () => {
        if (autoListenAfterMike && !isListening && SpeechRecognitionAPIConstructor && recognition) {
             if (!isLoading) toggleListen(true); 
        }
      };
      window.speechSynthesis.speak(utteranceRef.current);
    }
  };
  
  const handleSpeakText = (text: string) => { 
    if (isLiveTTSEnabled || isCallActive) {
        // In call/live mode, audio is streamed. Manual speak is for non-live messages.
        // Or, we could allow re-speaking standard TTS if live is off.
        // Let's assume for now that clicking speak on old messages uses standard TTS if live is off.
        if (isLiveTTSEnabled) {
            addMessage(MessageSender.SYSTEM, MessageType.TEXT, "النطق المباشر مفعل حاليًا. لا يمكن إعادة نطق الرسائل الفردية بهذه الطريقة.");
            return;
        }
    }
    if (!speechSynthesisSupported) {
        addMessage(MessageSender.SYSTEM, MessageType.ERROR, "عفوًا، خدمة نطق الكلام غير متاحة في متصفحك."); return;
    }
    if (!apiKeyExists) {
        addMessage(MessageSender.SYSTEM, MessageType.ERROR, "لا يمكن تشغيل الصوت بسبب عدم وجود مفتاح الواجهة (API Key)."); return;
    }
    speakMessage(text);
  };

  const toggleListen = useCallback((forceStart = false) => {
    const userId = getUserIdForStorage();
    if (!recognition || !apiKeyExists || !userId) {
        addMessage(MessageSender.SYSTEM, MessageType.ERROR, "خدمة التعرف على الصوت غير متاحة أو مفتاح الواجهة غير مهيأ أو لم يتم تسجيل الدخول/بدء جلسة ضيف.");
        return;
    }

    if (speechSynthesisSupported && !isCallActive) window.speechSynthesis.cancel(); // Don't cancel if in call
    if (!isCallActive) audioPlayerRef.current?.stopAndClear(); // Don't stop if in call, it's playing AI voice

    if (isListening && !forceStart) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      if (!isCallActive && !messages.some(m => m.text === VOICE_COMMAND_START && m.sender === MessageSender.SYSTEM && Date.now() - m.timestamp < 5000)) {
        addMessage(MessageSender.SYSTEM, MessageType.TEXT, VOICE_COMMAND_START);
      }
      try {
        recognition.lang = sttLanguage;
        recognition.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        addMessage(MessageSender.SYSTEM, MessageType.ERROR, "لم أتمكن من بدء التعرف على الصوت. حاول مرة أخرى.");
        setIsListening(false);
      }
    }
  }, [isListening, apiKeyExists, getUserIdForStorage, sttLanguage, messages, isCallActive]); 

  useEffect(() => { 
    if (!recognition) return;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const spokenText = event.results[0][0].transcript;
      handleSendMessage(spokenText); 
      setIsListening(false); 
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error, event.message);
      let errorMsg = "حدث خطأ أثناء التعرف على الصوت.";
      if (event.error === 'no-speech') errorMsg = "لم أسمع أي صوت واضح. الرجاء التأكد من التحدث بوضوح بالقرب من الميكروفون، أو حاول مرة أخرى.";
      else if (event.error === 'audio-capture') errorMsg = "مشكلة في الميكروفون. تأكد من أنه يعمل.";
      else if (event.error === 'not-allowed') errorMsg = "لم تسمح باستخدام الميكروفون.";
      else if (event.message && event.message !== event.error) errorMsg = `${errorMsg} (${event.message})`;
      addMessage(MessageSender.SYSTEM, MessageType.ERROR, errorMsg);
      setIsListening(false);
    };
    recognition.onend = () => {
        if (isListening) setIsListening(false);
    };
  }, [handleSendMessage, isListening, autoListenAfterMike]); 


  const handleAuth = (userFromAuth: { email: string; username: string }) => {
    const userIsAdmin = userFromAuth.email === ADMIN_EMAIL;
    const userToStore: User = { 
        id: userFromAuth.email, 
        username: userFromAuth.username, 
        email: userFromAuth.email,
        isAdmin: userIsAdmin 
    };
    localStorage.setItem('mikeCurrentUser', JSON.stringify(userToStore));
    setCurrentUser(userToStore);
    setIsGuest(false);
    if (userIsAdmin) {
      setShowAdminChoiceModal(true);
      localStorage.removeItem('mikeAdminChoiceMade'); 
    } else {
      setShowAdminChoiceModal(false); setAdminViewActive(false);
      localStorage.removeItem('mikeAdminChoiceMade');
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setCurrentUser(null); 
    setUserProfile(null);
    
    const guestUserId = GUEST_USER_ID;
    const ttsPref = localStorage.getItem(`mikeTTSEnabled_${guestUserId}`);
    setIsTTSEnabled(ttsPref ? JSON.parse(ttsPref) : false);
    const liveTtsPref = localStorage.getItem(`${LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX}${guestUserId}`);
    setIsLiveTTSEnabled(liveTtsPref ? JSON.parse(liveTtsPref) : false);
    const aiVoicePref = localStorage.getItem(`${LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX}${guestUserId}`);
    setSelectedAIVoiceURI(aiVoicePref || AI_VOICE_DEFAULT_URI);

    const sttLangPref = localStorage.getItem(`mikeSTTLang_${guestUserId}`);
    setSttLanguage(sttLangPref || SUPPORTED_STT_LANGUAGES[0].value);
    const ttsVoicePref = localStorage.getItem(`mikeTTSVoiceURI_${guestUserId}`);
    setSelectedTTSVoiceURI(ttsVoicePref || null);
    const autoListenPref = localStorage.getItem(`mikeAutoListen_${guestUserId}`);
    setAutoListenAfterMike(autoListenPref ? JSON.parse(autoListenPref) : false);
  };
  

  const handleLogoutOrSwitchUser = () => {
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
    audioPlayerRef.current?.stopAndClear();
    closeLiveAudioSession();
    if (isCallActive) setIsCallActive(false);

    const userId = getUserIdForStorage();
    if (userId && !isGuest && currentUser) { 
      localStorage.removeItem(`mikeLastActiveConv_${userId}`);
    }
    localStorage.removeItem('mikeCurrentUser');
    localStorage.removeItem('mikeAdminChoiceMade'); 
    
    setCurrentUser(null);
    setIsGuest(false); 
    setUserProfile(null); 
    setShowAdminChoiceModal(false);
    setAdminViewActive(false);
    resetGeminiChatSession(SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "")); 
    setMessages([]); 
    setConversations([]); 
    setCurrentConversationId(null);
    setIsTTSEnabled(false);
    setIsLiveTTSEnabled(false);
    setSelectedAIVoiceURI(AI_VOICE_DEFAULT_URI);
    setSttLanguage(SUPPORTED_STT_LANGUAGES[0].value);
    setSelectedTTSVoiceURI(null);
    setAutoListenAfterMike(false);
    setGlobalAnnouncement(null);
    setShowAnnouncementBanner(false);
  };
  
  const handleEnterAdminPanel = () => { setAdminViewActive(true); setShowAdminChoiceModal(false); localStorage.setItem('mikeAdminChoiceMade', 'admin'); setMessages([]); };
  const handleEnterUserViewFromModal = () => { setAdminViewActive(false); setShowAdminChoiceModal(false); localStorage.setItem('mikeAdminChoiceMade', 'user'); };
  const handleSwitchToUserViewFromPanel = () => { setAdminViewActive(false); localStorage.setItem('mikeAdminChoiceMade', 'user'); };

  const toggleTTS = () => { 
    const userId = getUserIdForStorage();
    if (!speechSynthesisSupported || !apiKeyExists || !userId) return;
    const newTTSEnabled = !isTTSEnabled;
    setIsTTSEnabled(newTTSEnabled);
    localStorage.setItem(`mikeTTSEnabled_${userId}`, JSON.stringify(newTTSEnabled));
    if (!newTTSEnabled && speechSynthesisSupported) window.speechSynthesis.cancel();
    if (newTTSEnabled && (isLiveTTSEnabled || isCallActive)) { 
        setIsLiveTTSEnabled(false);
        localStorage.setItem(`${LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX}${userId}`, JSON.stringify(false));
        if (isCallActive) handleEndCall(); // End call if enabling standard TTS
        else {
             audioPlayerRef.current?.stopAndClear();
             closeLiveAudioSession();
        }
    }
  };

  const toggleLiveTTS = () => { 
    const userId = getUserIdForStorage();
    if (!audioContextRef.current || !apiKeyExists || !userId) { 
        addMessage(MessageSender.SYSTEM, MessageType.ERROR, "خاصية النطق المباشر غير مدعومة في هذا المتصفح أو تحتاج لتهيئة.");
        return;
    }
    const newLiveTTSEnabled = !isLiveTTSEnabled;
    setIsLiveTTSEnabled(newLiveTTSEnabled);
    localStorage.setItem(`${LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX}${userId}`, JSON.stringify(newLiveTTSEnabled));
    
    if (!newLiveTTSEnabled) { // Turning Live TTS OFF
        if (isCallActive) handleEndCall(); // End call if turning off live TTS
        else {
            audioPlayerRef.current?.stopAndClear();
            closeLiveAudioSession();
        }
    } else { // Turning Live TTS ON
        if (isTTSEnabled) { // If standard TTS is enabled, disable it
            setIsTTSEnabled(false);
            localStorage.setItem(`mikeTTSEnabled_${userId}`, JSON.stringify(false));
            if (speechSynthesisSupported) window.speechSynthesis.cancel();
        }
        // Note: Session starts with first message or when a call is initiated.
    }
  };

  const handleAIVoiceURIChange = (voiceURI: string) => {
      setSelectedAIVoiceURI(voiceURI);
      const userId = getUserIdForStorage();
      if (userId) localStorage.setItem(`${LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX}${userId}`, voiceURI);
      // If a live session/call is active, it might need to be restarted for voice change to take effect.
      // For simplicity, the new voice will apply to the *next* session/call.
      if (isLiveAudioSessionActive() || isCallActive) {
          closeLiveAudioSession(); // Close current session so next one uses new voice
          if (isCallActive) { // If in call, try to restart call with new voice (might be abrupt)
              // This could be complex; for now, just note new voice applies next time
              addMessage(MessageSender.SYSTEM, MessageType.TEXT, "تم تغيير الصوت. سيتم تطبيقه في المكالمة أو الرد الصوتي المباشر التالي.");
          }
      }
  };


  const handleSttLanguageChange = (langValue: string) => {
      setSttLanguage(langValue);
      const userId = getUserIdForStorage();
      if(userId) localStorage.setItem(`mikeSTTLang_${userId}`, langValue);
      if(recognition) recognition.lang = langValue;
  };

  const handleTtsVoiceChange = (voiceURI: string) => { // For standard TTS
      setSelectedTTSVoiceURI(voiceURI);
      const userId = getUserIdForStorage();
      if(userId) localStorage.setItem(`mikeTTSVoiceURI_${userId}`, voiceURI);
      const voice = availableVoices.find(v => v.voiceURI === voiceURI);
      if (utteranceRef.current && voice) {
          utteranceRef.current.voice = voice;
          utteranceRef.current.lang = voice.lang;
      }
  };
  
  const toggleAutoListen = () => {
      const newAutoListen = !autoListenAfterMike;
      setAutoListenAfterMike(newAutoListen);
      const userId = getUserIdForStorage();
      if(userId) localStorage.setItem(`mikeAutoListen_${userId}`, JSON.stringify(newAutoListen));
      if (!newAutoListen && isListening && recognition) recognition.stop(); 
  };

  const dismissAnnouncement = () => {
    const userId = getUserIdForStorage();
    if (userId && globalAnnouncement?.id) {
      const dismissedKey = `mikeDismissedAnnouncements_${userId}`;
      const dismissed: string[] = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
      if (!dismissed.includes(globalAnnouncement.id)) {
        dismissed.push(globalAnnouncement.id);
        localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
      }
      setMessages(prev => prev.filter(msg => msg.id !== `announcement-${globalAnnouncement.id}`));
    }
    setShowAnnouncementBanner(false); 
  };

  // --- Call Feature Functions ---
  const handleStartCall = async () => {
    const userId = getUserIdForStorage();
    if (!userId || !apiKeyExists || !audioContextRef.current) {
      addMessage(MessageSender.SYSTEM, MessageType.ERROR, "لا يمكن بدء المكالمة. تأكد من أن كل شيء مهيأ.");
      return;
    }
    if (isCallActive) return; // Already in a call

    // Ensure live TTS is enabled for calls
    if (!isLiveTTSEnabled) {
        toggleLiveTTS(); // This will also disable standard TTS if it was on
    }
    if (isTTSEnabled) setIsTTSEnabled(false); // Ensure standard TTS is off

    setIsCallActive(true);
    setCallStatus("جاري الاتصال...");
    audioPlayerRef.current?.stopAndClear(); // Clear any previous audio
    
    // Optionally, add a system message to the chat for call initiation
    // addMessage(MessageSender.SYSTEM, MessageType.TEXT, "بدء مكالمة مع مايك...");

    // The first "message" in a call is an implicit greeting from Mike.
    // We send a predefined prompt to kick off the call from Mike's side.
    await handleSendMessage(CALL_GREETING_USER_INITIATED, true); 
    setCallStatus("متصل"); 
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallStatus("انتهت المكالمة");
    audioPlayerRef.current?.stopAndClear();
    closeLiveAudioSession();
    addMessage(MessageSender.SYSTEM, MessageType.TEXT, "تم إنهاء المكالمة.");
    // Optionally, turn off live TTS after a call if it was only enabled for the call
    // if (wasLiveTTSDisabledBeforeCall) toggleLiveTTS(); 
  };


  if (!currentUser && !isGuest) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AuthForm
          mode={authMode}
          onAuth={handleAuth}
          onToggleMode={() => setAuthMode(prev => prev === 'login' ? 'register' : 'login')}
          onGuestMode={handleGuestMode}
        />
         <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            تطوير <a href={CREATOR_LINK} target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-500 dark:hover:text-sky-300">{CREATOR_NAME}</a>
        </footer>
      </div>
    );
  }

  if (currentUser && !isGuest && showAdminChoiceModal) {
    return <AdminChoiceModal user={currentUser} onEnterAdminPanel={handleEnterAdminPanel} onEnterUserView={handleEnterUserViewFromModal} onLogout={handleLogoutOrSwitchUser} />;
  }

  if (currentUser && !isGuest && adminViewActive) {
    return <AdminPanel currentUserEmail={currentUser.email || currentUser.username} onSwitchToUserView={handleSwitchToUserViewFromPanel} onLogout={handleLogoutOrSwitchUser} />;
  }

  if (isCallActive) {
    return (
      <CallScreen
        messages={messages}
        callStatus={callStatus}
        onEndCall={handleEndCall}
        onSendMessage={handleSendMessage}
        userInput={userInput}
        setUserInput={setUserInput}
        isListening={isListening}
        onToggleListen={toggleListen}
        isLoading={isLoading}
        currentAiMessageIdForLiveAudio={currentAiMessageIdForLiveAudioRef.current}
        onSpeakText={handleSpeakText}
      />
    );
  }

  return (
    <div className="flex h-full max-h-screen bg-slate-100 dark:bg-slate-900">
      <div className={`fixed inset-y-0 right-0 z-30 w-72 sm:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out shadow-lg ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} sm:relative sm:translate-x-0 sm:border-l-0 sm:border-r`}>
        <ConversationHistory
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => loadConversation(id)}
          onNewConversation={() => startNewConversation()}
          onDeleteConversation={deleteConversation}
          onLogout={handleLogoutOrSwitchUser}
          currentUser={currentUser}
          isGuest={isGuest}
          userProfile={userProfile}
          onSaveProfile={saveUserProfile}
          
          sttLanguage={sttLanguage}
          onSttLanguageChange={handleSttLanguageChange}
          
          selectedAIVoiceURI={selectedAIVoiceURI}
          onAIVoiceURIChange={handleAIVoiceURIChange}
          isLiveTTSEnabled={isLiveTTSEnabled} 
          onToggleLiveTTS={toggleLiveTTS}     
          
          availableTTSVoices={availableVoices} /* For Standard TTS */
          selectedTTSVoiceURI={selectedTTSVoiceURI} /* For Standard TTS */
          onTtsVoiceChange={handleTtsVoiceChange} /* For Standard TTS */
          isTTSEnabled={isTTSEnabled} /* Standard TTS */
          onToggleTTS={toggleTTS}     /* Standard TTS */
          
          autoListenEnabled={autoListenAfterMike}
          onToggleAutoListen={toggleAutoListen}
          speechSynthesisSupported={speechSynthesisSupported}
          speechRecognitionSupported={!!SpeechRecognitionAPIConstructor}
          webAudioSupported={!!audioContextRef.current}
        />
      </div>

      <div className="flex flex-col flex-1 h-full max-h-screen">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
             <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 sm:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
                <div className="flex-1 text-center sm:text-right flex items-center sm:justify-start sm:ml-0 ml-auto"> 
                    <MikeLogo className="hidden sm:flex" iconOnly={true} size={28}/>
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200 truncate sm:mr-3">
                        {currentConversationId && conversations.find(c=>c.id === currentConversationId)?.name || AI_NAME}
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                 {currentUser && !isGuest && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        أهلًا بك، {userProfile?.displayName || currentUser.username}
                        {currentUser.isAdmin && <span className="text-sky-500 dark:text-sky-400 font-semibold"> (مطور)</span>}
                    </p>
                 )}
                 {isGuest && (
                     <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">أنت تتصفح كـ<span className="font-semibold">{GUEST_USERNAME}</span></p>
                 )}
            </div>
          </div>
        </header>

        {showAnnouncementBanner && globalAnnouncement && (
          <div className="bg-sky-100 dark:bg-sky-700/50 border-b border-sky-200 dark:border-sky-600 p-3 text-sky-700 dark:text-sky-200 text-sm relative">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
              <span>📢 **إعلان:** {globalAnnouncement.message}</span>
              <button onClick={dismissAnnouncement} className="p-1 text-sky-600 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-600 rounded-full" aria-label="إغلاق الإعلان">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}

        {!apiKeyExists && messages.some(m => m.id.startsWith('error-apikey')) && (
           <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 m-4 rounded-md shadow">
              <p className="font-bold">تنبيه هام:</p>
              <p className="text-sm">مفتاح الواجهة البرمجية (API_KEY) غير موجود. لن يتمكن التطبيق من التواصل مع خدمات الذكاء الاصطناعي.</p>
              <p className="text-sm">إذا كنت المطور، يرجى التأكد من تعيين متغير البيئة `API_KEY` بشكل صحيح.</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-sky-800 dark:bg-sky-950">
          <div className="max-w-3xl mx-auto w-full">
            {messages.filter(msg => !msg.id.startsWith('announcement-') || (msg.id === `announcement-${globalAnnouncement?.id}` && showAnnouncementBanner)).map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} onSpeak={handleSpeakText} />
            ))}
          </div>
          <div ref={chatEndRef} />
        </main>

        <footer className="bg-white dark:bg-slate-800 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 shadow-top sticky bottom-0">
          <div className="max-w-3xl mx-auto w-full">
            {selectedImagePreviewUrl && (
                <div className="mb-2 flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <img src={selectedImagePreviewUrl} alt="Preview" className="w-12 h-12 rounded object-cover" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs">
                            {selectedImageForUpload?.name || "صورة مختارة"}
                        </span>
                    </div>
                    <button onClick={clearSelectedImage} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full" aria-label="إزالة الصورة">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}
              className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse"
            >
              {SpeechRecognitionAPIConstructor && <VoiceInputButton onToggleListen={() => toggleListen()} isListening={isListening} disabled={isLoading || !apiKeyExists || (!currentUser && !isGuest)} />}
              <button
                type="button"
                onClick={handleStartCall}
                disabled={isLoading || !apiKeyExists || (!currentUser && !isGuest) || !audioContextRef.current || !isLiveTTSEnabled}
                title={!isLiveTTSEnabled ? "يجب تفعيل النطق المباشر أولاً لبدء مكالمة" : "بدء مكالمة مع مايك"}
                className={`p-2.5 sm:p-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="بدء مكالمة"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.532 2.529C3.197 2.203 2.733 2 2.25 2c-.482 0-.947.203-1.282.529L.065 3.43A.75.75 0 0 0 0 3.996V16.004a.75.75 0 0 0 .065.566l.903.903A1.733 1.733 0 0 0 2.25 18h15.5A1.733 1.733 0 0 0 19.032 17.47l.903-.903a.75.75 0 0 0 .065-.566V3.996a.75.75 0 0 0-.065-.566L18.935 2.53A1.733 1.733 0 0 0 17.75 2c-.482 0-.947.203-1.282.529l-2.107 2.106a.75.75 0 0 0 0 1.061L15.328 6.66A2.233 2.233 0 0 1 16 8.233v3.534A2.233 2.233 0 0 1 15.328 13.33l-.967.967a.75.75 0 0 0 0 1.06l2.107 2.107c.335.326.799.53 1.282.53.482 0 .947-.203 1.282-.529l.903-.903A2.25 2.25 0 0 0 20 16.004V3.996A2.25 2.25 0 0 0 19.032 3.13l-.903-.903C17.797 1.897 17.182 1.5 16.5 1.5c-.682 0-1.297.397-1.632 1.029L12.76 6.952a.75.75 0 0 1-1.06 0L9.688 4.94a.75.75 0 0 0-1.061 0L6.532 6.952a.75.75 0 0 1-1.061 0L3.532 5.013V2.53ZM7 7.057V12.75a.75.75 0 0 0 1.5 0V7.057l-.75-.753-.75.753Zm5.5 0V12.75a.75.75 0 0 0 1.5 0V7.057l-.75-.753-.75.753Z"/></svg>
              </button>
              <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileSelect} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading || !apiKeyExists || (!currentUser && !isGuest) || (isLiveTTSEnabled || isCallActive)} 
                title={(isLiveTTSEnabled || isCallActive) ? "تحميل الصور معطل أثناء النطق المباشر أو المكالمة" : "تحميل صورة للتحليل"}
                className={`p-2.5 sm:p-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-200 rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 disabled:opacity-50 ${(isLiveTTSEnabled || isCallActive) ? 'cursor-not-allowed' : ''}`}
                aria-label="تحميل صورة للتحليل"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.53 9.53l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.452a1.125 1.125 0 0 0 1.59 1.591l3.456-3.554a3 3 0 0 0 0-4.243Z" clipRule="evenodd" /></svg>
              </button>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isListening ? "جاري الاستماع..." : (isLoading ? `${AI_NAME} يفكر...` : (selectedImageForUpload ? "اكتب سؤالك عن الصورة..." : "اكتب رسالتك أو سؤالك هنا..."))}
                className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition duration-150 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base"
                disabled={isLoading || isListening || !apiKeyExists || (!currentUser && !isGuest)}
              />
              <button
                type="submit"
                disabled={isLoading || (!userInput.trim() && !selectedImageForUpload) || !apiKeyExists || (!currentUser && !isGuest)}
                className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                aria-label="إرسال"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 transform rtl:scale-x-[-1]"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
              </button>
            </form>
          </div>
        </footer>
      </div>
       {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/30 z-20 sm:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        )}
    </div>
  );
};

export default App;