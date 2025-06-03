import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part, LiveServerMessage, Session } from "@google/genai";
import { SYSTEM_INSTRUCTION, AI_VOICE_DEFAULT_URI } from '../constants';
import { GroundingChunk as LocalGroundingChunk } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  console.error("API_KEY environment variable is not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });

let chatSession: Chat | null = null;
let liveAudioSession: Session | null = null; 
let liveSessionResponseQueue: LiveServerMessage[] = [];
let liveSessionTurnCompleCallback: (() => void) | null = null;
let liveSessionErrorCallback: ((error: string) => void) | null = null;

const getInitialSystemInstruction = (): string => {
  const adminInstruction = localStorage.getItem('mikeAdminSystemInstruction');
  return adminInstruction || SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "");
}

let currentSystemInstruction: string = getInitialSystemInstruction();

window.addEventListener('systemPromptAdminUpdate', ((event: CustomEvent) => {
  if (event.detail && typeof event.detail === 'string') {
    console.log("AdminPanel updated system prompt. Updating service...");
    updateChatSystemInstruction(event.detail, true);
  }
}) as EventListener);

export const updateChatSystemInstruction = (newInstruction: string, isAdminUpdate: boolean = false): void => {
  const adminSavedInstruction = localStorage.getItem('mikeAdminSystemInstruction');
  let instructionToUse = adminSavedInstruction || newInstruction;

  if (isAdminUpdate && adminSavedInstruction) {
    const profileBlockPlaceholder = "{USER_PROFILE_INFO_BLOCK}";
    if (newInstruction.includes(profileBlockPlaceholder)) {
        const profileBlockContent = extractProfileBlock(newInstruction);
        instructionToUse = adminSavedInstruction.replace(profileBlockPlaceholder, profileBlockContent);
    } else {
        const currentProfileBlock = extractProfileBlock(currentSystemInstruction);
        instructionToUse = adminSavedInstruction.replace(profileBlockPlaceholder, currentProfileBlock);
    }
  } else if (adminSavedInstruction) {
    const profileBlockContent = extractProfileBlock(newInstruction);
    instructionToUse = adminSavedInstruction.replace("{USER_PROFILE_INFO_BLOCK}", profileBlockContent);
  } else {
    instructionToUse = newInstruction;
  }
  
  if (instructionToUse !== currentSystemInstruction) {
    currentSystemInstruction = instructionToUse;
    chatSession = null;
  }
};

const extractProfileBlock = (fullInstruction: string): string => {
    const profileBlockRegex = /(معلومات المستخدم الحالية.*?---\n)/s;
    const match = fullInstruction.match(profileBlockRegex);
    if (match && match[1]) {
        return match[1];
    }
    const placeholder = "{USER_PROFILE_INFO_BLOCK}";
    if (SYSTEM_INSTRUCTION.includes(placeholder)) {
        const parts = SYSTEM_INSTRUCTION.split(placeholder);
        if (parts.length === 2) {
            let potentialBlock = fullInstruction;
            if (potentialBlock.startsWith(parts[0])) {
                potentialBlock = potentialBlock.substring(parts[0].length);
            }
            if (potentialBlock.endsWith(parts[1])) {
                potentialBlock = potentialBlock.substring(0, potentialBlock.length - parts[1].length);
            }
            if (potentialBlock.includes("---") || potentialBlock.trim() === "") return potentialBlock;
        }
    }
    return ""; 
};

const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      config: {
        systemInstruction: currentSystemInstruction,
      },
    });
  }
  return chatSession;
};

export const generateTextStream = async (
  prompt: string,
  onChunk: (textChunk: string, isFinal: boolean, groundingChunks?: LocalGroundingChunk[]) => void,
  onError: (error: string) => void,
  uploadedImage?: { mimeType: string; data: string } 
): Promise<void> => {
  if (!apiKey || apiKey === "MISSING_API_KEY") {
    onError("API Key not configured. Please contact the administrator.");
    onChunk("", true);
    return;
  }
  try {
    const currentChat = getChatSession();
    
    let messageParts: Part[];
    if (uploadedImage && uploadedImage.data) {
      const imagePart: Part = {
        inlineData: {
          mimeType: uploadedImage.mimeType,
          data: uploadedImage.data,
        },
      };
      const textPart: Part = { text: prompt };
      messageParts = [imagePart, textPart];
    } else {
      messageParts = [{ text: prompt }];
    }

    const requestPayload: { message: Part[]; tools?: Tool[] } = {
      message: messageParts,
    };

    if (!uploadedImage || !uploadedImage.data) {
      requestPayload.tools = [{ googleSearch: {} }] as Tool[];
    }

    const result = await currentChat.sendMessageStream(requestPayload);
    
    // Add validation check for result
    if (!result || typeof result[Symbol.asyncIterator] !== 'function') {
      throw new Error('Invalid response from Gemini API: Response is not iterable');
    }

    let accumulatedText = "";
    let finalGroundingChunks: LocalGroundingChunk[] | undefined;

    for await (const chunk of result) {
      if (!chunk) continue; // Skip null or undefined chunks
      
      const textPart = chunk.text;
      if (textPart) {
        accumulatedText += textPart;
        onChunk(textPart, false, chunk.candidates?.[0]?.groundingMetadata?.groundingChunks as LocalGroundingChunk[] | undefined);
      }
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        finalGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks as LocalGroundingChunk[];
      }
    }
    onChunk("", true, finalGroundingChunks);
  } catch (error) {
    console.error("Gemini API text/image analysis error:", error);
    let errorMessage = `عفوًا، واجهتني مشكلة في معالجة طلبك.`;
    if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
    } else {
        errorMessage += ` ${String(error)}`;
    }
    if (String(error).includes("TOOL_CODE_INVALID_ARGUMENT") || String(error).includes("GoogleSearch")) {
        errorMessage += " قد تكون هناك مشكلة في استخدام أداة البحث حاليًا.";
    }
    onError(errorMessage);
    onChunk("", true);
  }
};

export const generateImage = async (prompt: string): Promise<{ imageUrl?: string; error?: string }> => {
  if (!apiKey || apiKey === "MISSING_API_KEY") {
    return { error: "API Key not configured. Please contact the administrator." };
  }
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await response.json();
    
    if (data.error && data.error.status === 'PERMISSION_DENIED') {
      return { error: "عذراً، ميزة إنشاء الصور تتطلب حساباً مدفوعاً. يرجى التواصل مع المطور." };
    }
    
    const imageResponse = await ai.models.generateImages({
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
      const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
      return { imageUrl: `data:image/jpeg;base64,${base64ImageBytes}` };
    }
    return { error: "لم أتمكن من إنشاء الصورة. حاول مرة أخرى بطلب مختلف." };
  } catch (error) {
    console.error("Gemini API image generation error:", error);
    if (error instanceof Error && error.message.includes('INVALID_ARGUMENT')) {
      return { error: "عذراً، ميزة إنشاء الصور تتطلب حساباً مدفوعاً. يرجى التواصل مع المطور." };
    }
    return { error: `عذراً، حدث خطأ في إنشاء الصورة. ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const resetChat = (newSystemInstructionFromApp?: string): void => {
  const adminInstruction = localStorage.getItem('mikeAdminSystemInstruction');
  let instructionToUse = newSystemInstructionFromApp || adminInstruction || SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "");

  if (newSystemInstructionFromApp) {
      if (adminInstruction) {
          const profileBlockContent = extractProfileBlock(newSystemInstructionFromApp);
          instructionToUse = adminInstruction.replace("{USER_PROFILE_INFO_BLOCK}", profileBlockContent);
      } else {
          instructionToUse = newSystemInstructionFromApp;
      }
  } else if (adminInstruction) {
      instructionToUse = adminInstruction.replace("{USER_PROFILE_INFO_BLOCK}", "");
  }
  
  if (instructionToUse !== currentSystemInstruction) {
      currentSystemInstruction = instructionToUse;
      chatSession = null;
  } else if (newSystemInstructionFromApp && instructionToUse === currentSystemInstruction) {
      chatSession = null;
  }
  if (liveAudioSession) {
    liveAudioSession.close();
    liveAudioSession = null;
  }
};

export const startLiveAudioSession = async (
  selectedVoiceName: string, 
  onTextChunk: (text: string, isPartial: boolean) => void, 
  onAudioChunk: (audioData: string, mimeType: string) => void, 
  onTurnComplete: () => void,
  onError: (error: string) => void
): Promise<boolean> => {
  if (!apiKey || apiKey === "MISSING_API_KEY") {
    onError("API Key not configured for live audio.");
    return false;
  }
  if (liveAudioSession) {
    return true; 
  }

  liveSessionTurnCompleCallback = onTurnComplete;
  liveSessionErrorCallback = onError;

  try {
    liveAudioSession = await ai.live.connect({
      config: {
        systemInstruction: currentSystemInstruction,
      },
      callbacks: {
        onopen: () => {},
        onmessage: (message: LiveServerMessage) => {
          liveSessionResponseQueue.push(message);
        },
        onerror: (e: ErrorEvent) => {
          console.error('Live audio session error:', e.message);
          if(liveSessionErrorCallback) liveSessionErrorCallback(`مشكلة في الاتصال الصوتي المباشر: ${e.message}`);
          liveAudioSession = null; 
        },
        onclose: (e: CloseEvent) => {
          liveAudioSession = null;
        },
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to start live audio session:", error);
    onError(`فشل في بدء جلسة الصوت المباشر: ${error instanceof Error ? error.message : String(error)}`);
    liveAudioSession = null;
    return false;
  }
};

export const sendToLiveAudioSession = async (
  prompt: string,
  onTextChunk: (text: string, isPartial: boolean) => void,
  onAudioChunk: (audioData: string, mimeType: string) => void
): Promise<void> => {
  if (!liveAudioSession) {
    console.error("Live audio session not active. Cannot send message.");
    if(liveSessionErrorCallback) liveSessionErrorCallback("جلسة الصوت المباشر غير مفعلة.");
    return;
  }
  
  try {
    liveAudioSession.sendClientContent({
      turns: [ { text: prompt } ] 
    });
    await handleLiveSessionTurn(onTextChunk, onAudioChunk);
  } catch (error) {
      console.error("Error sending message to live audio session:", error);
      if(liveSessionErrorCallback) liveSessionErrorCallback(`خطأ في إرسال الرسالة للجلسة المباشرة: ${error instanceof Error ? error.message : String(error)}`);
  }
};

async function handleLiveSessionTurn(
    onTextChunk: (text: string, isPartial: boolean) => void,
    onAudioChunk: (audioData: string, mimeType: string) => void
): Promise<void> {
    let done = false;
    let accumulatedText = "";
    while (!done) {
        const message = liveSessionResponseQueue.shift();
        if (message) {
            if (message.serverContent?.modelTurn?.parts) {
                message.serverContent.modelTurn.parts.forEach(part => {
                    if (part.text) {
                        accumulatedText += part.text;
                        onTextChunk(part.text, true);
                    }
                    if (part.inlineData?.data && part.inlineData?.mimeType) {
                        onAudioChunk(part.inlineData.data, part.inlineData.mimeType);
                    }
                });
            }
            if (message.serverContent?.turnComplete) {
                done = true;
                onTextChunk("", false);
                if(liveSessionTurnCompleCallback) liveSessionTurnCompleCallback();
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

export const closeLiveAudioSession = (): void => {
  if (liveAudioSession) {
    try {
        liveAudioSession.close();
    } catch (e) {}
    liveAudioSession = null;
  }
  liveSessionResponseQueue = [];
  liveSessionTurnCompleCallback = null;
  liveSessionErrorCallback = null;
};

export const isLiveAudioSessionActive = (): boolean => {
    return liveAudioSession !== null;
};