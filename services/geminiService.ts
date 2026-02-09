import { GoogleGenAI, Type } from '@google/genai';
import { Plant, Coords, WeatherInfo, PersistentTask } from '../types';
import { marked } from 'marked';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

const languageNames: Record<string, string> = {
  en: 'English',
  it: 'Italian',
};
const getLanguageName = (code: string): string => languageNames[code] || code;

const parseJsonFromMarkdown = <T>(markdownString: string): T => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = markdownString.match(jsonRegex);
  const jsonString = match ? match[1] : markdownString;
  return JSON.parse(jsonString);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const identifyPlant = async (
  base64Image: string,
  mimeType: string,
  language: string
): Promise<{ name: string; description: string; careNeeds: string; imageUrl: string }> => {
  const imagePart = {
    inlineData: { data: base64Image, mimeType },
  };
  const textPart = {
    text: `Identify this plant. Provide its common name, a brief description, and basic care needs. Respond in ${getLanguageName(language)}.`,
  };
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Common name of the plant.' },
      description: { type: Type.STRING, description: 'A brief description of the plant.' },
      careNeeds: { type: Type.STRING, description: 'Basic care needs (sunlight, water, soil).' },
    },
    required: ['name', 'description', 'careNeeds'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    }
  });

  try {
    const json = parseJsonFromMarkdown<{ name: string; description: string; careNeeds: string }>(response.text);
    const imageSearchResponse = await searchPlantByName(json.name, language);
    return { ...json, imageUrl: imageSearchResponse.imageUrl };
  } catch (e) {
    console.error("Failed to parse plant identification JSON or search image:", e);
    throw new Error("Could not identify the plant from the image. Please try again.");
  }
};

export const searchPlantByName = async (
  plantName: string,
  language: string
): Promise<{ name: string; description: string; careNeeds: string; imageUrl: string }> => {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Common name of the plant.' },
      description: { type: Type.STRING, description: 'A brief description of the plant.' },
      careNeeds: { type: Type.STRING, description: 'Basic care needs (sunlight, water, soil).' },
    },
    required: ['name', 'description', 'careNeeds'],
  };

  const textResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide a brief description and basic care needs for a ${plantName}. Respond in ${getLanguageName(language)}.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    }
  });

  let plantData;
  try {
    plantData = parseJsonFromMarkdown<{ name: string; description: string; careNeeds: string }>(textResponse.text);
  } catch (e) {
    console.error("Failed to parse plant search JSON:", e);
    throw new Error("Could not find information for the specified plant. Please try again.");
  }

  const imageResponse = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A beautiful, premium plant icon of a ${plantName}. Use a color palette featuring forest green (#007A33), tomato orange (#FF6B35), and warm beige (#FDF8F0). The style should be clean, modern, and artistic, suitable for a high-end gardening app.`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (!imageResponse.generatedImages?.[0]?.image.imageBytes) {
    throw new Error('Could not generate an image for the plant.');
  }
  const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
  const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

  return { ...plantData, imageUrl };
};

export const generateDetailedCarePlan = async (plant: Plant, language: string): Promise<string> => {
  const prompt = `Create a detailed care plan for a ${plant.name}.
    Cover the following topics in detail:
    - Watering schedule and techniques
    - Sunlight requirements (direct vs. indirect, hours per day)
    - Soil type and fertilization needs
    - Temperature and humidity preferences
    - Common pests and diseases to watch for
    - Pruning tips
    - Repotting advice

    Format the response as Markdown. Use headings for each section. Respond in ${getLanguageName(language)}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const markdown = response.text;
  return marked(markdown) as string;
};

// ============================================
// Annual Careplan Generation
// ============================================

interface AnnualTask {
  task: string;
  reason: string;
  category: string;
  taskNature: string;
  scheduledMonth: number;
  windowStart: string; // YYYY-MM-DD
  windowEnd: string;   // YYYY-MM-DD
  priority: string;
}

export const generateAnnualCareplan = async (
  plant: Plant,
  coords?: Coords | null,
  weather?: WeatherInfo | null,
  language: string = 'en'
): Promise<AnnualTask[]> => {
  const now = new Date();
  const year = now.getFullYear();

  let locationContext = '';
  if (coords) {
    locationContext = `User location: Latitude ${coords.latitude}, Longitude ${coords.longitude}. Determine the climate zone from these coordinates.`;
  } else if (plant.latitude && plant.longitude) {
    locationContext = `Plant location: Latitude ${plant.latitude}, Longitude ${plant.longitude}. Determine the climate zone from these coordinates.`;
  } else {
    locationContext = `No coordinates available. Assume a temperate Mediterranean climate (USDA zone 8-9).`;
  }

  let weatherContext = '';
  if (weather) {
    weatherContext = `Current weather: ${weather.temperature}°C, ${weather.condition}.`;
  }

  const langName = getLanguageName(language);

  const prompt = `
IMPORTANT: ALL text content in the "task" and "reason" fields MUST be written in ${langName}. Do NOT use English.

You are an expert horticulturist. Generate a STRUCTURAL annual care plan for the year ${year} for the following plant.

Plant: ${plant.name}
Description: ${plant.description}
Care needs: ${plant.careNeeds}
${plant.notes ? `User notes: ${plant.notes}` : ''}
${locationContext}
${weatherContext}

Generate 15-30 STRUCTURAL tasks distributed across all 12 months. These are time-sensitive tasks with precise optimal windows.

Categories to use (keep these category values in English, they are identifiers):
- "pruning" - Pruning (structural, with window)
- "grafting" - Grafting (structural, tight window)
- "seeding" - Seeding (structural)
- "fertilizing" - Fertilization (periodic)
- "harvesting" - Harvest (seasonal)
- "pest_prevention" - Disease/pest prevention (seasonal)
- "repotting" - Repotting/soil care
- "general" - Other structural care

DO NOT generate routine watering tasks. Those will be generated separately based on real-time weather.

Each task must have:
- "task": short action description (in ${langName})
- "reason": brief explanation of why and when (in ${langName})
- "category": one of the categories above (keep in English)
- "taskNature": always "structural" for this function
- "scheduledMonth": integer 1-12
- "windowStart": "YYYY-MM-DD" start of optimal window
- "windowEnd": "YYYY-MM-DD" end of optimal window
- "priority": "urgent" | "normal" | "low"

Respond ONLY with a JSON array of task objects. Remember: "task" and "reason" MUST be in ${langName}.
`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        task: { type: Type.STRING },
        reason: { type: Type.STRING },
        category: { type: Type.STRING },
        taskNature: { type: Type.STRING },
        scheduledMonth: { type: Type.INTEGER },
        windowStart: { type: Type.STRING },
        windowEnd: { type: Type.STRING },
        priority: { type: Type.STRING },
      },
      required: ['task', 'reason', 'category', 'taskNature', 'scheduledMonth', 'windowStart', 'windowEnd', 'priority'],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  try {
    return parseJsonFromMarkdown<AnnualTask[]>(response.text);
  } catch (e) {
    console.error("Failed to parse annual careplan JSON:", e);
    return [];
  }
};

// ============================================
// Biweekly Adaptation
// ============================================

interface AdaptationResult {
  newTasks: Array<{
    plantId: string;
    plantName: string;
    task: string;
    reason: string;
    category: string;
    taskNature: string;
    scheduledMonth: number;
    windowStart: string;
    windowEnd: string;
    priority: string;
  }>;
  modifications: Array<{
    taskId: string;
    newWindowStart?: string;
    newWindowEnd?: string;
    newPriority?: string;
  }>;
}

export const adaptBiweeklyTasks = async (
  plants: Plant[],
  pendingTasks: PersistentTask[],
  completedHistory: PersistentTask[],
  coords?: Coords | null,
  weather?: WeatherInfo | null,
  language: string = 'en'
): Promise<AdaptationResult> => {
  if (plants.length === 0) return { newTasks: [], modifications: [] };

  const now = new Date();
  const plantList = plants.map(p => `- ${p.name} (ID: ${p.id}): ${p.careNeeds}${p.notes ? ` | Notes: ${p.notes}` : ''}`).join('\n');

  const pendingList = pendingTasks.map(t =>
    `- [${t.id}] ${t.plantName}: "${t.task}" (${t.category}, ${t.taskNature}) window: ${t.windowStart || 'none'} to ${t.windowEnd || 'none'}, priority: ${t.priority}`
  ).join('\n');

  const completedList = completedHistory.slice(0, 30).map(t =>
    `- ${t.plantName}: "${t.task}" completed ${t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'recently'}${t.userNotes ? ` (notes: ${t.userNotes})` : ''}`
  ).join('\n');

  let locationContext = '';
  if (coords) {
    locationContext = `Location: Lat ${coords.latitude}, Lon ${coords.longitude}.`;
  } else {
    const plantWithCoords = plants.find(p => p.latitude && p.longitude);
    if (plantWithCoords) {
      locationContext = `Location (from plant): Lat ${plantWithCoords.latitude}, Lon ${plantWithCoords.longitude}.`;
    } else {
      locationContext = `No location. Assume temperate Mediterranean climate.`;
    }
  }

  const langName = getLanguageName(language);

  const prompt = `
IMPORTANT: ALL text content in "task" and "reason" fields MUST be written in ${langName}. Do NOT use English for these fields.

You are an expert horticulturist performing a biweekly adaptation of care tasks.

Current date: ${now.toISOString().split('T')[0]}
${locationContext}
${weather ? `Current weather: ${weather.temperature}°C, ${weather.condition}.` : 'Weather data unavailable.'}

Plants:
${plantList}

Pending structural tasks (next 30 days):
${pendingList || 'None'}

Recently completed tasks:
${completedList || 'None'}

Your job:
1. ROUTINE TASKS: Generate watering/checking tasks ONLY if weather conditions require it (e.g., no rain for 5+ days, extreme heat, frost warning). Each routine task needs a plant ID and name.
2. STRUCTURAL ADJUSTMENTS: If weather conditions (frost, extreme heat, prolonged rain) affect pending structural tasks, suggest window modifications.
3. NEVER re-propose tasks that are already completed.

Respond with a JSON object with two arrays:
- "newTasks": array of new tasks to create. Each with: plantId, plantName, task (in ${langName}), reason (in ${langName}), category (in English), taskNature ("routine"), scheduledMonth, windowStart (YYYY-MM-DD), windowEnd (YYYY-MM-DD), priority
- "modifications": array of modifications to existing tasks. Each with: taskId, newWindowStart (optional), newWindowEnd (optional), newPriority (optional)

If nothing needs to change, return empty arrays. Respond ONLY with JSON. Remember: "task" and "reason" MUST be in ${langName}.
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      newTasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            plantId: { type: Type.STRING },
            plantName: { type: Type.STRING },
            task: { type: Type.STRING },
            reason: { type: Type.STRING },
            category: { type: Type.STRING },
            taskNature: { type: Type.STRING },
            scheduledMonth: { type: Type.INTEGER },
            windowStart: { type: Type.STRING },
            windowEnd: { type: Type.STRING },
            priority: { type: Type.STRING },
          },
          required: ['plantId', 'plantName', 'task', 'reason', 'category', 'taskNature', 'scheduledMonth', 'windowStart', 'windowEnd', 'priority'],
        },
      },
      modifications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskId: { type: Type.STRING },
            newWindowStart: { type: Type.STRING },
            newWindowEnd: { type: Type.STRING },
            newPriority: { type: Type.STRING },
          },
          required: ['taskId'],
        },
      },
    },
    required: ['newTasks', 'modifications'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  try {
    return parseJsonFromMarkdown<AdaptationResult>(response.text);
  } catch (e) {
    console.error("Failed to parse biweekly adaptation JSON:", e);
    return { newTasks: [], modifications: [] };
  }
};

// ============================================
// Legacy: generateToDoList (kept for reference)
// ============================================
export const generateToDoList = async (
  plants: Plant[],
  coords: Coords,
  weather: WeatherInfo,
  language: string
): Promise<any[]> => {
  // Legacy function - no longer used by the new persistent task system
  return [];
};

// ============================================
// Chat
// ============================================
export const chatWithBotanica = async (
  messages: { text: string; sender: 'user' | 'botanica' }[],
  plants: Plant[],
  language: string
): Promise<string> => {
  const plantContext = plants.length > 0
    ? `The user has the following plants in their garden: ${plants.map(p => p.name).join(', ')}.`
    : "The user doesn't have any plants in their garden yet.";

  const history = messages.slice(0, -1).map(m => `${m.sender === 'user' ? 'User' : 'Botanica'}: ${m.text}`).join('\n');
  const currentMessage = messages[messages.length - 1].text;

  const prompt = `
    You are Anica, a friendly and expert AI garden assistant.
    ${plantContext}

    Conversation history:
    ${history}

    Current User Message: ${currentMessage}

    IMPORTANT: Respond in the language used by the user in their current message. If uncertain, default to ${getLanguageName(language)}.
    Focus on plant care, identification, pests, pruning, and gardening tips.
    Maintain a premium, supportive, and encouraging tone.
    Your name is Anica.
    `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
};
