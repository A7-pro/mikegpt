
export enum MessageSender {
  USER = 'User',
  AI = 'Mike',
  SYSTEM = 'System'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image', // AI generated image
  ERROR = 'error',
  LOADING = 'loading'
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text?: string;
  imageUrl?: string; // For AI generated images
  timestamp: number;
  groundingChunks?: GroundingChunk[];
  uploadedImagePreviewUrl?: string; // For user-uploaded images for analysis
  isImageQuery?: boolean; // True if the user's message is a query about an uploaded image
}

export interface GroundingChunkWeb {
  uri?: string;
  title: string;
}
    
export interface GroundingChunk {
  web: GroundingChunkWeb;
}
    
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}
    
export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}

export interface GenerateContentResponsePart {
 text?: string;
}

export interface GenerateContentResponseData {
 text: string; 
 candidates?: Candidate[]; 
}

export interface UserProfile {
  displayName?: string;
  age?: number;
  nationality?: string;
}

export interface User {
  id: string; 
  username: string; 
  email?: string; 
  profile?: UserProfile; 
  isAdmin?: boolean; 
}

export interface PersonalityTemplate {
  id: string;
  name: string;
  prompt: string;
  isSystemDefault?: boolean; 
}

export interface GlobalAnnouncement {
  id: string;
  message: string;
  timestamp: number;
}

export interface STTLanguage {
  value: string;
  label: string;
}

export enum AIGender {
  DEFAULT = 'default', // Could be Zephyr or other high-quality non-gendered
  MALE = 'male',
  FEMALE = 'female',
}

export interface AIVoiceOption {
  uri: string; // voiceURI or a special identifier like 'Zephyr'
  name: string; // Display name in Arabic
  genderHint: AIGender | 'neutral'; // For categorization
}