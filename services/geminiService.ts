import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part, LiveServerMessage, Session, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION, AI_VOICE_DEFAULT_URI } from '../constants';
import { GroundingChunk as LocalGroundingChunk } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  console.error("API_KEY environment variable is not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey });

let chatSession: Chat | null = null;
let liveAudioSession: Session | null = null; 
let liveSessionResponseQueue: LiveServerMessage[] = [];
let liveSessionTurnCompleteCallback: (() => void) | null = null;
let liveSessionErrorCallback: ((error: string) => void) | null = null;

const getInitialSystemInstruction = (): string => {
  return localStorage.getItem('mikeAdminSystemInstruction') || SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "");
};

let currentSystemInstruction = getInitialSystemInstruction();

window.addEventListener('systemPromptAdminUpdate', ((event: CustomEvent) => {
  if (typeof event.detail === 'string') {
    updateChatSystemInstruction(event.detail, true);
  }
}) as EventListener);

const extractProfileBlock = (instruction: string): string => {
  const match = instruction.match(/(معلومات المستخدم الحالية.*?---\n)/s);
  return match?.[1] || "";
};

export const updateChatSystemInstruction = (newInstruction: string, isAdminUpdate = false): void => {
  const adminInstruction = localStorage.getItem('mikeAdminSystemInstruction');
  let instructionToUse = newInstruction;

  if (isAdminUpdate && adminInstruction) {
    const profileBlock = extractProfileBlock(newInstruction) || extractProfileBlock(currentSystemInstruction);
    instructionToUse = adminInstruction.replace("{USER_PROFILE_INFO_BLOCK}", profileBlock);
  }

  if (instructionToUse !== currentSystemInstruction) {
    currentSystemInstruction = instructionToUse;
    chatSession = null;
  }
};

const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({ config: { systemInstruction: currentSystemInstruction } });
  }
  return chatSession;
};

export const generateTextStream = async (
  prompt: string,
  onChunk: (textChunk: string, isFinal: boolean, groundingChunks?: LocalGroundingChunk[]) => void,
  onError: (error: string) => void,
  uploadedImage?: { mimeType: string; data: string } 
): Promise<void> => {
  if (!apiKey) {
    onError("API Key not configured. Please contact the administrator.");
    onChunk("", true);
    return;
  }

  try {
    const currentChat = getChatSession();

    const messageParts: Part[] = [];
    if (uploadedImage?.data) {
      messageParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: uploadedImage.data } });
    }
    if (prompt) {
      messageParts.push({ text: prompt });
    }

    const requestPayload = { message: messageParts };

    const result = await currentChat.sendMessageStream(requestPayload);

    if (!result || typeof result[Symbol.asyncIterator] !== 'function') {
      throw new Error('Invalid response from Gemini API: Response is not iterable');
    }

    let accumulatedText = "";
    let finalGroundingChunks: LocalGroundingChunk[] | undefined;

    for await (const chunk of result) {
      if (!chunk) continue;

      const textPart = chunk.text;
      if (textPart) {
        accumulatedText += textPart;
        onChunk(textPart, false, chunk.candidates?.[0]?.groundingMetadata?.groundingChunks);
      }

      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        finalGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
      }
    }

    onChunk("", true, finalGroundingChunks);
  } catch (error) {
    console.error("Gemini API error:", error);
    let errorMessage = `عفوًا، واجهتني مشكلة في معالجة طلبك.`;
    if (error instanceof Error) errorMessage += ` ${error.message}`;
    onError(errorMessage);
    onChunk("", true);
  }
};

export const generateImage = async (prompt: string): Promise<{ imageUrl?: string; error?: string }> => {
  if (!apiKey) {
    return { error: "API Key not configured. Please contact the administrator." };
  }

  try {
    const imageResponse = await ai.models.generateImages({
      prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (imageResponse?.generatedImages?.[0]?.image?.imageBytes) {
      return { imageUrl: `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}` };
    }

    return { error: "لم أتمكن من إنشاء الصورة. حاول مرة أخرى بطلب مختلف." };
  } catch (error) {
    console.error("Gemini API image error:", error);
    return { error: `عذراً، حدث خطأ في إنشاء الصورة. ${error instanceof Error ? error.message : String(error)}` };
  }
};

export const resetChat = (newInstruction?: string): void => {
  const adminInstruction = localStorage.getItem('mikeAdminSystemInstruction');
  currentSystemInstruction = newInstruction || adminInstruction || SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "");
  chatSession = null;

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
  if (!apiKey) {
    onError("API Key not configured for live audio.");
    return false;
  }
  if (liveAudioSession) return true;

  liveSessionTurnCompleteCallback = onTurnComplete;
  liveSessionErrorCallback = onError;

  try {
    liveAudioSession = await ai.live.connect({
      config: { systemInstruction: currentSystemInstruction },
      callbacks: {
        onopen: () => {},
        onmessage: (message: LiveServerMessage) => liveSessionResponseQueue.push(message),
        onerror: (e: ErrorEvent) => {
          onError(`مشكلة في الاتصال الصوتي المباشر: ${e.message}`);
          liveAudioSession = null;
        },
        onclose: () => {
          liveAudioSession = null;
        },
      },
    });
    return true;
  } catch (error) {
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
    liveSessionErrorCallback?.("جلسة الصوت المباشر غير مفعلة.");
    return;
  }

  try {
    liveAudioSession.sendClientContent({ turns: [{ text: prompt }] });
    await handleLiveSessionTurn(onTextChunk, onAudioChunk);
  } catch (error) {
    liveSessionErrorCallback?.(`خطأ في إرسال الرسالة للجلسة المباشرة: ${error instanceof Error ? error.message : String(error)}`);
  }
};

async function handleLiveSessionTurn(
  onTextChunk: (text: string, isPartial: boolean) => void,
  onAudioChunk: (audioData: string, mimeType: string) => void
): Promise<void> {
  let done = false;
  while (!done) {
    const message = liveSessionResponseQueue.shift();
    if (message) {
      message.serverContent?.modelTurn?.parts?.forEach(part => {
        if (part.text) onTextChunk(part.text, true);
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          onAudioChunk(part.inlineData.data, part.inlineData.mimeType);
        }
      });
      if (message.serverContent?.turnComplete) {
        done = true;
        onTextChunk("", false);
        liveSessionTurnCompleteCallback?.();
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export const closeLiveAudioSession = (): void => {
  try { liveAudioSession?.close(); } catch {}
  liveAudioSession = null;
  liveSessionResponseQueue = [];
  liveSessionTurnCompleteCallback = null;
  liveSessionErrorCallback = null;
};

export const isLiveAudioSessionActive = (): boolean => !!liveAudioSession;
