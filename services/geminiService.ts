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

    // Ensure the entire stream process is within the try/catch block
    const result = await currentChat.sendMessageStream(requestPayload);

    if (!result || typeof result[Symbol.asyncIterator] !== 'function') {
      throw new Error('Invalid response from Gemini API: Response is not iterable');
    }

    let accumulatedText = "";
    let finalGroundingChunks: LocalGroundingChunk[] | undefined;

    for await (const chunk of result) {
      if (!chunk) continue; // Skip empty chunks

      const textPart = chunk.text;
      if (textPart) {
        accumulatedText += textPart;
        // Pass grounding chunks as they arrive or when finalized
        onChunk(textPart, false, chunk.candidates?.[0]?.groundingMetadata?.groundingChunks);
      }

      // Update final grounding chunks if present in the chunk
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        finalGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
      }
    }

    // Signal final state and pass the last known grounding chunks
    onChunk("", true, finalGroundingChunks);

  } catch (error) {
    console.error("Gemini API error:", error);
    // Use a generic Arabic error message, optionally adding the technical detail in English/source language
    let errorMessage = `عفوًا، واجهتني مشكلة في معالجة طلبك.`;
    if (error instanceof Error && error.message) {
        // Append technical detail in parentheses, assuming English messages are desired for debugging info
        errorMessage += ` (${error.message})`;
    } else if (typeof error === 'string') {
         errorMessage += ` (${error})`;
    }

    onError(errorMessage);
    onChunk("", true); // Ensure the stream is marked as complete on error
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
    let errorMessage = `عذراً، حدث خطأ في إنشاء الصورة.`;
     if (error instanceof Error && error.message) {
        errorMessage += ` (${error.message})`;
    } else if (typeof error === 'string') {
         errorMessage += ` (${error})`;
    }
    return { error: errorMessage };
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
    let errorMessage = `فشل في بدء جلسة الصوت المباشر:`;
    if (error instanceof Error && error.message) {
        errorMessage += ` (${error.message})`;
    } else if (typeof error === 'string') {
         errorMessage += ` (${error})`;
    }
    onError(errorMessage);
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
    let errorMessage = `خطأ في إرسال الرسالة للجلسة المباشرة:`;
     if (error instanceof Error && error.message) {
        errorMessage += ` (${error.message})`;
    } else if (typeof error === 'string') {
         errorMessage += ` (${error})`;
    }
    liveSessionErrorCallback?.(errorMessage);
  }
};

async function handleLiveSessionTurn(
  onTextChunk: (text: string, isPartial: boolean) => void,
  onAudioChunk: (audioData: string, mimeType: string) => void
): Promise<void> {
  let done = false;
  while (!done) {
    // Use a small delay to prevent tight loop blocking if queue is empty
    if (liveSessionResponseQueue.length === 0) {
       await new Promise(resolve => setTimeout(resolve, 50));
       continue; // Check queue again
    }

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
        onTextChunk("", false); // Signal end of partial text
        liveSessionTurnCompleteCallback?.();
      }
    }
  }
}

export const closeLiveAudioSession = (): void => {
  try { liveAudioSession?.close(); } catch {} // Handle potential errors during close
  liveAudioSession = null;
  liveSessionResponseQueue = [];
  liveSessionTurnCompleteCallback = null;
  liveSessionErrorCallback = null;
};

export const isLiveAudioSessionActive = (): boolean => !!liveAudioSession;
