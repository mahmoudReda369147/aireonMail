import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Email, Task } from "../types";

// Helper to get a fresh client instance to ensure the latest API key is used
console.log("process.env.API_KEY",process.env.API_KEY)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Retry Logic ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Extract error details safely to handle various error structures
    const errorCode = error.status || error?.error?.code || error?.code;
    const errorMessage = error.message || error?.error?.message || '';
    const errorStatus = error.status || error?.error?.status;

    // Check for Rate Limit (429)
    const isRateLimit = errorCode === 429 || errorMessage.includes('429') || errorMessage.includes('quota');
    
    // Check for Server Errors (500, 503)
    const isServerError = errorCode === 500 || errorCode === 503;
    
    // Check for Network/XHR/RPC Errors
    // Error code 6 in XHR often means connection lost/refused
    const isNetworkError = 
        errorMessage.includes('xhr error') || 
        errorMessage.includes('Rpc failed') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('fetch failed') ||
        errorCode === 6 ||
        errorStatus === 'UNKNOWN';

    if (retries > 0 && (isRateLimit || isServerError || isNetworkError)) {
      // Calculate wait time with Jitter to prevent thundering herd
      const jitter = Math.random() * 500;
      const waitTime = backoff + jitter;
      
      console.warn(`Gemini API Warning (${errorCode || 'Network'}). Retrying in ${Math.round(waitTime)}ms...`, errorMessage);
      
      await delay(waitTime);
      return withRetry(operation, retries - 1, backoff * 2);
    }
    
    // If we ran out of retries or it's a different error, throw it
    throw error;
  }
}

// --- Text & Reasoning ---

export const getSmartInboxAnalysis = async (emailBody: string, subject: string) => {
  // Use 2.5 Flash for reliable throughput on batch tasks
  const model = "gemini-3-flash-preview"; 
  
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: `Analyze this email. Subject: ${subject}. Body: ${emailBody}. 
      Return JSON with:
      - priorityScore (0-100 integer)
      - summary (max 15 words)
      - tags (array of strings, e.g. "Work", "Urgent", "Finance")`,
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
  } catch (e) {
    console.error("Smart Analysis Failed", e);
    return { priorityScore: 50, summary: "Analysis failed", tags: [] };
  }
};

export const analyzeActionItems = async (emailBody: string, currentSubject: string) => {
  const model = "gemini-3-flash-preview"; 
  const ai = getAiClient();

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: `Analyze this email content for actionable items.
      1. Extract specific tasks.
      2. Detect if there is a meeting request, invitation, or scheduling proposal.
      
      Subject: "${currentSubject}"
      Body: "${emailBody}"
      
      Return a JSON object.`,
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
                  description: { type: Type.STRING, description: "The task description" },
                  deadline: { type: Type.STRING, description: "Date or time mentioned, or null if none", nullable: true },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["description", "priority"]
              }
            },
            meeting: {
              type: Type.OBJECT,
              properties: {
                 title: { type: Type.STRING, description: "Suggested title for the calendar event" },
                 date: { type: Type.STRING, description: "Date of the meeting (YYYY-MM-DD or readable format)" },
                 time: { type: Type.STRING, description: "Time of the meeting" },
                 duration: { type: Type.STRING, description: "Duration e.g. '30 mins'" },
                 participants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Names of people involved" },
                 agenda: { type: Type.STRING, description: "Brief agenda or topic" }
              },
              nullable: true,
              description: "Null if no meeting/scheduling detected"
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
  } catch (e) {
    console.error("Action analysis failed", e);
    return { tasks: [], meeting: null };
  }
};

export const generateReply = async (email: Email, instruction: string) => {
  const model = "gemini-3-pro-preview"; // Use Pro for high quality writing
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Write a reply to this email.
    Instruction: ${instruction}
    
    IMPORTANT: Return the response as raw HTML suitable for a rich text editor.
    Use <p> for paragraphs, <br> for line breaks, <strong> for emphasis.
    Do NOT use Markdown. Do NOT wrap in \`\`\`html code blocks. Just return the raw HTML string.
    
    From: ${email.sender}
    Subject: ${email.subject}
    Body: ${email.body}`,
  }));
  return response.text;
};

export const improveDraft = async (draft: string, instruction: string) => {
  const model = "gemini-3-flash-preview"; // Fast iteration
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Improve this email draft based on instruction: "${instruction}".\n\nDraft:\n${draft}`,
  }));
  return response.text;
};

export const generateEmailDraft = async (prompt: string, senderName: string) => {
  const model = "gemini-3-flash-preview";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: `Write an email body based on this request: "${prompt}".
    Sender: ${senderName}
    Output only the email body text. Do not include subject line.`,
  }));
  return response.text;
};

// --- Audio ---

export const transcribeAudio = async (base64Audio: string) => {
  const model = "gemini-3-flash-preview";
  const ai = getAiClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "audio/wav", data: base64Audio } }, // Assuming wav wrapper or raw if supported
        { text: "Transcribe this audio accurately." }
      ]
    }
  }));
  return response.text;
};

// --- Images ---

export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  // Use Gemini 3 Pro Image for generation
  const model = "gemini-3-pro-image-preview";
  
  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
            imageSize: size,
            aspectRatio: "1:1"
        }
      }
    }));
    
    // Extract image from parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image gen failed", e);
    throw e;
  }
};

export const editImage = async (base64Image: string, prompt: string) => {
  // Use Gemini 2.5 Flash Image for editing/analysis
  const model = "gemini-3-flash-preview-image";
  const ai = getAiClient();
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/png", data: base64Image.replace(/^data:image\/\w+;base64,/, "") } },
        { text: prompt }
      ]
    }
  }));

  // Check for image output
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  // Fallback if it returns text describing the edit instead
  return null;
};

export const generateNanoLogo = async () => {
  // Specific function for branding generation using Nano Banana (gemini-3-flash-preview-image)
  const model = "gemini-3-flash-preview-image";
  // Updated prompt: Explicitly asking for Pure Black background to facilitate screen blending.
  const prompt = "A minimalist, abstract logo for 'Aireon' featuring a stylized triangular 'A' shape. The design uses neon Magenta (#D946EF) and Cyan (#06b6d4) glowing lines. The background must be **PURE BLACK** (#000000) with absolutely no gradient, stars, or texture. The logo should be centered, vector-style, sharp, and high contrast.";

  try {
    const ai = getAiClient();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    }));
    
    // Extract image from parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) {
    console.error("Logo gen failed", e);
    return null;
  }
}

// --- Video (Veo) ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  // Veo requires the user to select their OWN paid API key in a real deployment.
  const model = 'veo-3.1-fast-generate-preview';
  
  const ai = getAiClient();
  
  let operation = await ai.models.generateVideos({
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  
  // Fetch actual bytes (mocked slightly here as we can't fetch from backend in browser without proxy often)
  return `${videoUri}&key=${process.env.API_KEY}`;
};


// --- Live API helper ---
export const getLiveClient = () => {
    return getAiClient().live;
}