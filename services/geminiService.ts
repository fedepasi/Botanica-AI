// FIX: Implemented geminiService.ts with Gemini API calls.
import { GoogleGenAI, Type } from '@google/genai';
import { Plant, CareTask, Coords, WeatherInfo } from '../types';
import { marked } from 'marked';

// AI client setup
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to safely parse JSON that might be wrapped in markdown
const parseJsonFromMarkdown = <T>(markdownString: string): T => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = markdownString.match(jsonRegex);
  const jsonString = match ? match[1] : markdownString;
  return JSON.parse(jsonString);
};

// Utility to convert file to base64
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


// Function to identify a plant from an image
export const identifyPlant = async (
  base64Image: string,
  mimeType: string,
  language: string
): Promise<{ name: string; description: string; careNeeds: string; imageUrl: string }> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `Identify this plant. Provide its common name, a brief description, and basic care needs. Respond in ${language}.`,
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
      responseSchema: responseSchema,
    }
  });

  try {
    const json = parseJsonFromMarkdown<{ name: string; description: string; careNeeds: string; }>(response.text);
    // Fetch a clean image for the identified plant to ensure consistency
    const imageSearchResponse = await searchPlantByName(json.name, language);
    return { ...json, imageUrl: imageSearchResponse.imageUrl };
  } catch (e) {
    console.error("Failed to parse plant identification JSON or search image:", e);
    throw new Error("Could not identify the plant from the image. Please try again.");
  }
};

// Function to search for a plant by name
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
    contents: `Provide a brief description and basic care needs for a ${plantName}. Respond in ${language}.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    }
  });

  let plantData;
  try {
    plantData = parseJsonFromMarkdown<{ name: string; description: string; careNeeds: string; }>(textResponse.text);
  } catch (e) {
    console.error("Failed to parse plant search JSON:", e);
    throw new Error("Could not find information for the specified plant. Please try again.");
  }

  const imageResponse = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A clear, high-quality photo of a single, healthy ${plantName} plant in a simple pot, against a neutral background.`,
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

// Function to generate a detailed care plan
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
    
    Format the response as Markdown. Use headings for each section. Respond in ${language}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const markdown = response.text;
  return marked(markdown) as string;
};

// Function to generate a to-do list for plant care
export const generateToDoList = async (
  plants: Plant[],
  coords: Coords,
  weather: WeatherInfo,
  language: string
): Promise<CareTask[]> => {
  if (plants.length === 0) {
    return [];
  }
  const plantList = plants.map(p => `- ${p.name}: ${p.careNeeds}`).join('\n');

  const prompt = `
    Based on the following list of plants, their basic care needs, the user's location, and the current weather, generate a JSON array of care tasks for the upcoming week.
    
    Current Date: ${new Date().toDateString()}
    Location: Latitude ${coords.latitude}, Longitude ${coords.longitude}
    Current Weather: ${weather.temperature}°C, ${weather.condition}.
    
    Plants:
    ${plantList}
    
    Consider the weather and general plant care schedules.
    - Generate tasks that should have been done in the last couple of days as "Overdue".
    - Generate urgent tasks for today as "Today".
    - Generate routine tasks for the next 7 days as "This Week".
    
    Each task object in the JSON array must have five properties: "plantName", "task" (a short action, e.g., "Water", "Prune"), "reason" (a brief explanation), "timing" (a string: "Overdue", "Today", or "This Week"), and "category" (a string: "pruning", "grafting", "watering", or "general").
    
    Proactively identify if any plant needs pruning or if it's the right season for grafting.
    
    Respond in ${language}. Respond ONLY with the JSON array.
    `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        plantName: { type: Type.STRING, description: "The name of the plant." },
        task: { type: Type.STRING, description: "The care task to be performed." },
        reason: { type: Type.STRING, description: "The reason for the task." },
        timing: { type: Type.STRING, enum: ['Overdue', 'Today', 'This Week'], description: "The urgency of the task." },
        category: { type: Type.STRING, enum: ['pruning', 'grafting', 'watering', 'general'], description: "The category of the task." },
      },
      required: ['plantName', 'task', 'reason', 'timing', 'category'],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  try {
    return parseJsonFromMarkdown<CareTask[]>(response.text);
  } catch (e) {
    console.error("Failed to parse to-do list JSON:", e);
    // Return an empty array on parsing failure
    return [];
  }
};

// Function for conversational AI chat with Botanica
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
    You are Botanica, a friendly and expert AI garden assistant. 
    ${plantContext}
    
    Conversation history:
    ${history}
    
    Current User Message: ${currentMessage}
    
    Provide a helpful, concise, and expert response in ${language}. 
    Focus on plant care, identification, pests, pruning, and gardening tips. 
    Maintain a premium, supportive, and encouraging tone.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
};