
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Email, Task } from "../types";

// Helper to get a fresh client instance to ensure the latest API key is used
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Retry Logic ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Extract error details safely
    const errorCode = error.status || error?.error?.code || error?.code;
    const errorMessage = error.message || error?.error?.message || '';
    
    // Check for Resource Exhausted (429) - specific message for user feedback
    const isQuotaExceeded = errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota') || errorCode === 429;
    
    if (isQuotaExceeded) {
        console.error("Gemini API Quota Exceeded. Please check your billing/plan at ai.google.dev");
        // We throw a custom error so the UI can handle it specifically
        throw new Error("QUOTA_EXHAUSTED");
    }

    // Check for Server Errors (500, 503) or Network issues
    const isRetryable = errorCode === 500 || errorCode === 503 || errorMessage.includes('fetch failed') || errorMessage.includes('NetworkError');

    if (retries > 0 && isRetryable) {
      const waitTime = backoff + Math.random() * 500;
      await delay(waitTime);
      return withRetry(operation, retries - 1, backoff * 2);
    }
    
    throw error;
  }
}

// --- Text & Reasoning ---

export const getSmartInboxAnalysis = async (emailBody: string, subject: string) => {
  // Use Gemini 3 Flash for high-speed analysis
  const model = "gemini-3-flash-preview"; 
  
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: `Analyze this email. Subject: ${subject}. Body: ${emailBody}. 
      Return JSON with:
      - priorityScore (0-100 integer)
      - summary (max 15 words)
      - tags (array of strings)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }));
    return JSON.parse(response.text || "{}");
  } catch (e: any) {
    if (e.message === "QUOTA_EXHAUSTED") return { priorityScore: 50, summary: "Quota exceeded", tags: ["System"] };
    return { priorityScore: 50, summary: "Analysis unavailable", tags: [] };
  }
};

export const analyzeActionItems = async (emailBody: string, currentSubject: string) => {
  const model = "gemini-3-flash-preview"; 
  const ai = getAiClient();

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: `Extract tasks and meetings from: "${currentSubject}" - "${emailBody}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  deadline: { type: Type.STRING, nullable: true },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["description", "priority"]
              }
            },
            meeting: {
              type: Type.OBJECT,
              properties: {
                 title: { type: Type.STRING },
                 date: { type: Type.STRING },
                 time: { type: Type.STRING },
                 duration: { type: Type.STRING },
                 agenda: { type: Type.STRING }
              },
              nullable: true
            }
          }
        }
      }
    }));
    
    const result = JSON.parse(response.text || "{}");
    return {
        tasks: result.tasks || [],
        meeting: result.meeting || null
    };
  } catch (e: any) {
    if (e.message === "QUOTA_EXHAUSTED") throw new Error("Please check your API quota.");
    throw e;
  }
};

export const generateReply = async (email: Email, instruction: string) => {
  // Use Gemini 3 Pro for creative writing
  const model = "gemini-3-flash-preview"; 
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Write an HTML reply to: From: ${email.sender}, Subject: ${email.subject}. Instruction: ${instruction}`,
  }));
  return response.text;
};

export const improveDraft = async (draft: string, instruction: string) => {
  const model = "gemini-3-flash-preview";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Improve this email draft: "${instruction}".\n\nDraft:\n${draft}`,
  }));
  return response.text;
};

export const generateEmailDraft = async (prompt: string, senderName: string) => {
  const model = "gemini-3-flash-preview";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Draft an email for: "${prompt}". Sender: ${senderName}`,
  }));
  return response.text;
};

// --- Images ---

export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  const model = "gemini-3-flash-image-preview";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { imageSize: size, aspectRatio: "1:1" }
    }
  }));
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateNanoLogo = async () => {
  const model = "gemini-2.5-flash-image";
  const prompt = "Minimalist glowing logo for 'Aireon' AI Mail app, neon colors, pure black background.";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
  }));
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

// --- Edit Images ---

/**
 * Edits an image using gemini-2.5-flash-image.
 * Takes a base64 encoded image or data URL and a text prompt.
 * Following the Google GenAI guidelines for image editing.
 */
export const editImage = async (base64ImageData: string, prompt: string) => {
  const model = 'gemini-2.5-flash-image';
  const ai = getAiClient();
  
  // Extract base64 data and mime type if it's a data URI
  let data = base64ImageData;
  let mimeType = 'image/png';
  if (base64ImageData.startsWith('data:')) {
    const matches = base64ImageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      data = matches[2];
    }
  }

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  }));

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    // Find the image part in the response, do not assume it is the first part.
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// --- Video ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const model = 'veo-3.1-fast-generate-preview';
  const ai = getAiClient();
  
  let operation = await ai.models.generateVideos({
    model,
    prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${videoUri}&key=${process.env.API_KEY}`;
};

export const getLiveClient = () => getAiClient().live;
