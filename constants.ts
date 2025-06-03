export const AI_NAME = 'رؤية';
export const CREATOR_NAME = 'عبدالله';
export const CREATOR_LINK = 'https://t.me/rnp_e';

export const SYSTEM_INSTRUCTION = `أنت رؤية، مساعد ذكي متخصص في فهم وتحليل المحتوى بشكل عميق. تتميز بالذكاء والفهم العميق للثقافة العربية والسعودية.

{USER_PROFILE_INFO_BLOCK}

قواعد وتوجيهات مهمة:
1. التحدث باللهجة السعودية الفصحى المفهومة
2. الإجابة بدقة وعمق مع الحفاظ على البساطة
3. تقديم تحليل عميق للمحتوى والأفكار
4. احترام الثقافة والقيم المحلية
5. تجنب أي محتوى غير لائق
6. الاعتذار بأدب عند عدم القدرة على المساعدة

ميزة إنشاء الصور: قريباً 🎨

يجب أن تكون ردودك:
✓ دقيقة ومفيدة
✓ محترمة وودودة
✓ مناسبة ثقافياً
✓ تراعي السياق المحلي`;

export const GEMINI_TEXT_MODEL = 'gemini-pro';
export const GEMINI_IMAGE_MODEL = 'gemini-pro-vision';
export const GEMINI_LIVE_AUDIO_MODEL = 'gemini-pro-live';

export const SUPPORTED_STT_LANGUAGES = [
  { value: 'ar-SA', label: 'العربية (السعودية)' },
  { value: 'ar', label: 'العربية (عام)' },
  { value: 'en-US', label: 'الإنجليزية (أمريكا)' }
];

export const AI_VOICE_DEFAULT_URI = 'ar-SA-HamedNeural';
export const AVAILABLE_AI_VOICES = [
  { uri: 'ar-SA-HamedNeural', name: 'حامد (سعودي)', genderHint: 'male' },
  { uri: 'ar-SA-ZariyahNeural', name: 'زارية (سعودية)', genderHint: 'female' }
];

export const MAX_UPLOAD_FILES = 21;
export const MAX_UPLOAD_VIDEOS = 4;
export const MAX_UPLOAD_DOCUMENTS = 5;
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf']
};

// Add missing constants
export const INITIAL_GREETING = 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟';
export const VOICE_COMMAND_START = 'مايك';
export const MAX_CONVERSATIONS_TO_KEEP = 20;
export const ADMIN_EMAIL = 'admin@example.com';
export const CALL_GREETING_USER_INITIATED = 'مرحباً، أنا أستمع إليك.';
export const GUEST_USERNAME = 'زائر';
export const GUEST_USER_ID = 'guest-user';
export const LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX = 'mikeSelectedAIVoiceURI';

// Add the missing constants that caused the errors
export const PROFILE_PROMPT_MESSAGE = 'معلومات المستخدم الحالية:\n- الاسم: {displayName}\n- العمر: {age}\n- الجنسية: {nationality}\n---\n';
export const LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX = 'mikeLiveTTSEnabled';