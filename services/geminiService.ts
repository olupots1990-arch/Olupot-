import { GoogleGenAI, Chat, Modality, FunctionDeclaration, Type, GenerateContentResponse, LiveServerMessage, Blob } from "@google/genai";
import { ChatMode, Message } from "../types";
import { decode, pcmToWav } from '../utils/audio';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CONFIG = {
  [ChatMode.STANDARD]: {
    name: 'gemini-2.5-flash',
    config: {},
  },
  [ChatMode.THINKING]: {
    name: 'gemini-2.5-pro',
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
    },
  },
  [ChatMode.LOW_LATENCY]: {
    name: 'gemini-flash-lite-latest',
    config: {},
  },
};

const orderDeliveryFunctionDeclaration: FunctionDeclaration = {
    name: 'orderDelivery',
    description: "Places a delivery order for food items from STANLEY'S CAFETERIA to a given address. It also requires the customer's name and phone number.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'A list of food items to be ordered.',
            },
            deliveryAddress: {
                type: Type.STRING,
                description: 'The full address for the delivery.',
            },
            customerName: {
                type: Type.STRING,
                description: "The name of the customer placing the order.",
            },
            phoneNumber: {
                type: Type.STRING,
                description: "The phone number of the customer.",
            }
        },
        required: ['items', 'deliveryAddress', 'customerName', 'phoneNumber'],
    },
};

const getProductsFunctionDeclaration: FunctionDeclaration = {
    name: 'getProducts',
    description: 'Retrieves the list of available food products and their prices from the menu.',
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: [],
    },
};

export const initChat = (mode: ChatMode, systemInstruction: string): Chat => {
  const modelInfo = MODEL_CONFIG[mode];
  return ai.chats.create({
    model: modelInfo.name,
    config: {
      ...modelInfo.config,
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: [orderDeliveryFunctionDeclaration, getProductsFunctionDeclaration] }],
    },
  });
};

export const sendMessage = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  const response = await chat.sendMessage({ message });
  return response;
};

export const sendToolResponse = async (chat: Chat, toolCallId: string, toolName: string, output: any): Promise<GenerateContentResponse> => {
    const response = await chat.sendMessage({
        message: [
            {
                functionResponse: {
                    name: toolName,
                    response: { result: output },
                },
            },
        ]
    });
    return response;
};

export const analyzeImage = async (
  prompt: string,
  image: { base64Image: string; mimeType: string }
): Promise<string> => {
  const imagePart = {
    inlineData: {
      mimeType: image.mimeType,
      data: image.base64Image,
    },
  };
  const textPart = {
    text: prompt,
  };
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, imagePart] },
  });
  return response.text;
};

export const getTextToSpeechUrl = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from API.");
  }

  const decodedBytes = decode(base64Audio);
  const wavBlob = pcmToWav(decodedBytes, 24000, 1, 16);
  const url = URL.createObjectURL(wavBlob);
  return url;
};

export const transcribeAudio = async (audio: { base64Audio: string; mimeType: string }): Promise<string> => {
  const audioPart = {
    inlineData: {
      mimeType: audio.mimeType,
      data: audio.base64Audio,
    },
  };
  const promptPart = {
      text: "Transcribe the following audio:"
  };
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [promptPart, audioPart] },
  });
  return response.text;
};

export const connectLiveSession = (
  callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => void;
    onError: (error: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
  },
  systemInstruction: string
) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemInstruction,
    },
  });
};

export const performAiSearch = async (query: string, history: Message[]): Promise<string> => {
  if (history.length === 0) {
    return "The chat history is empty. Nothing to search.";
  }

  const formattedHistory = history
    .filter(m => m.author === 'user' || m.author === 'bot')
    .map(m => `${m.author}: ${m.text}`)
    .join('\n');

  const prompt = `You are an intelligent search assistant inside a chat application. 
Your task is to analyze the provided chat history to answer the user's search query.
Provide a concise summary of the findings. Do not greet the user, just provide the summary directly.

Search Query: "${query}"

Chat History:
---
${formattedHistory}
---
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
  });

  return response.text;
};