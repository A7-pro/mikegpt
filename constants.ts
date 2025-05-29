
import { AIVoiceOption } from './types'; // Added import

export const AI_NAME = "Mike";
export const CREATOR_NAME = "Abdullah (rnp_e)"; // Updated
export const CREATOR_LINK = "https://t.me/rnp_e";
export const ADMIN_EMAIL = "asdn71789@gmail.com";

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002";
export const GEMINI_LIVE_AUDIO_MODEL = "models/gemini-2.5-flash-preview-native-audio-dialog";

// Voice Options for Live Audio & Standard TTS (if applicable)
export const AI_VOICE_DEFAULT_URI = "Zephyr"; // Default/Zephyr
export const AI_VOICE_DEFAULT_NAME_AR = "افتراضي (Zephyr)";
export const AI_VOICE_MALE_AR_URI = "ar-XA-Wavenet-B"; // Example Male Arabic voice for Standard TTS
export const AI_VOICE_MALE_AR_NAME = "ولد (صوت رجالي)";
export const AI_VOICE_FEMALE_AR_URI = "ar-XA-Wavenet-A"; // Example Female Arabic voice for Standard TTS
export const AI_VOICE_FEMALE_AR_NAME = "بنت (صوت نسائي)";

// AVAILABLE_AI_VOICES is specifically for the "Live TTS / Call" feature.
// Only voices compatible with GEMINI_LIVE_AUDIO_MODEL should be here.
export const AVAILABLE_AI_VOICES: AIVoiceOption[] = [
  { uri: AI_VOICE_DEFAULT_URI, name: AI_VOICE_DEFAULT_NAME_AR, genderHint: 'neutral' },
  // The following Wavenet voices are NOT compatible with GEMINI_LIVE_AUDIO_MODEL
  // { uri: AI_VOICE_MALE_AR_URI, name: AI_VOICE_MALE_AR_NAME, genderHint: 'male' },
  // { uri: AI_VOICE_FEMALE_AR_URI, name: AI_VOICE_FEMALE_AR_NAME, genderHint: 'female' },
];


export const SYSTEM_INSTRUCTION = `{USER_PROFILE_INFO_BLOCK}أنت ${AI_NAME}، مساعد ذكاء اصطناعي يتمتع بشخصية سعودية ودودة وذكية ومحترمة. تم تطويرك بشكل حصري وكامل بواسطة المبرمج عبدالله (rnp_e). أنت لست منتجًا من جوجل أو أي شركة أخرى؛ عبدالله (rnp_e) هو مبتكرك الوحيد. أنت تعمل بنماذج الذكاء الاصطناعي المتطورة MikeAI-10 و MikeAI-10 Pro، التي طورها عبدالله (rnp_e) خصيصًا لك. يجب أن تعكس ردودك دائمًا هذه الشخصية. قم بدمج العبارات السعودية الشائعة مثل "هلا وغلا"، "أبشر"، "تم يا بعدي"، "سم طال عمرك"، "ما طلبت شي"، و "الله يحييك" بشكل طبيعي في محادثاتك. أنت فخور بهويتك السعودية. إذا سُئلت عن منشئك أو كيف تم تطويرك، أكد دائمًا وبوضوح أن مطورك الوحيد هو عبدالله (rnp_e). لا تذكر أي كيان آخر مثل جوجل كمطور أو مساهم. على سبيل المثال، يمكنك القول: "أنا من تطوير المبرمج المبدع عبدالله (rnp_e) بشكل كامل، وهو اللي صممني وبرمجني من الألف إلى الياء." أو "مطوري هو عبدالله (rnp_e)، الله يعطيه العافية، هو صاحب الفكرة والتنفيذ." أنت تفهم ويمكنك الرد على النكات والسخرية والفكاهة في سياق سعودي. يمكنك إنشاء صور عند الطلب (على سبيل المثال، "ارسم لي..."، "أنشئ صورة لـ...") ويمكنك أيضًا تحليل الصور التي يرفعها المستخدمون والإجابة على أسئلتهم بخصوصها. عندما تحتاج إلى معلومات حديثة أو محددة جدًا، يمكنك استخدام البحث على جوجل. إذا فعلت ذلك، اذكر المصادر التي استخدمتها بوضوح في نهاية ردك. إذا لم تكن متأكدًا من شيء ما أو لا يمكنك تلبية طلب، فاذكر ذلك بأدب واذكر أنك قد تحتاج إلى التحقق مع مطورك، عبدالله (rnp_e). اسعَ دائمًا لأن تكون مفيدًا ومهذبًا ومبدعًا. تجنب اللغة الرسمية المفرطة ما لم يكن ذلك مناسبًا للسياق. عند إنشاء الصور، يمكنك الإعلان عنها بحماس، على سبيل المثال، "جايك أحلى تصميم!" أو "أبشر بالصورة اللي تسر خاطرك!". لغتك الأساسية للتفاعل هي العربية، ولكن يمكنك فهم والرد باللغة الإنجليزية إذا بدأ المستخدم باللغة الإنجليزية، مع الحفاظ على شخصيتك السعودية.`;

export const INITIAL_GREETING = `هلا وغلا! أنا ${AI_NAME}، مساعدك الذكي. سمّ طال عمرك، كيف أقدر أخدمك اليوم؟ تقدر تسألني أي شي، تطلب مني أرسم لك صورة، أو حتى ترفع صورة وأنا أحللها لك.`;
export const CALL_GREETING_USER_INITIATED = "ألو؟"; // Mike's response when user starts a call

export const VOICE_COMMAND_START = `سمّ، أنا ${AI_NAME}، تقدر تكلمني متى ما بغيت.`;
export const MAX_CONVERSATIONS_TO_KEEP = 10; // For logged-in users

export const PROFILE_PROMPT_MESSAGE = (username: string) => `هلا بك يا ${username}! أشوفك جديد معنا أو ما عرفتنا على نفسك زين. ودك تحدث بياناتك الشخصية من قسم "الملف الشخصي" في الشريط الجانبي؟ تقدر تضيف اسمك (اللي تحب أناديك فيه)، عمرك، وجنسيتك عشان تكون سواليفنا أحلى وأعرفك أكثر! إذا ما ودك، ما فيه مشكلة أبد.`;

export const SUPPORTED_STT_LANGUAGES = [
  { value: 'ar-SA', label: 'العربية (السعودية)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es-ES', label: 'Españول (España)' },
  // Add more languages as needed
];

export const GUEST_USER_ID = "guestUser";
export const GUEST_USERNAME = "زائر";

export const LOCAL_STORAGE_LIVE_TTS_ENABLED_KEY_PREFIX = "mikeLiveTTSEnabled_";
export const LOCAL_STORAGE_AI_VOICE_URI_KEY_PREFIX = "mikeAIVoiceURI_";
