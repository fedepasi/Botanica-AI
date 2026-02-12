import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@^1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: string;
  [key: string]: any;
}

const languageNames: Record<string, string> = {
  en: "English",
  it: "Italian",
};

const getLanguageName = (code: string): string => languageNames[code] || code;

const getWeatherConditionLabel = (code: number): string => {
  const conditions: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Light snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm + hail",
    99: "Thunderstorm + heavy hail",
  };
  return conditions[code] || "Unknown";
};

const formatForecastContext = (weather: any): string => {
  if (!weather) return "Weather data unavailable.";

  let ctx = `Current weather: ${weather.temperature}°C, ${weather.condition}.`;

  if (weather.forecast?.daily) {
    const { time, temperature_2m_max, temperature_2m_min, weather_code, precipitation_sum } =
      weather.forecast.daily;
    ctx += `\n\n7-day forecast:`;
    for (let i = 0; i < time.length; i++) {
      const minT = Math.round(temperature_2m_min[i]);
      const maxT = Math.round(temperature_2m_max[i]);
      const cond = getWeatherConditionLabel(weather_code[i]);
      const rain = precipitation_sum[i];
      const frost = minT <= 0 ? " ⚠️ FROST RISK" : "";
      ctx += `\n- ${time[i]}: ${minT}°C / ${maxT}°C, ${cond}, ${rain}mm rain${frost}`;
    }
  }

  return ctx;
};

const parseJsonFromMarkdown = <T>(markdownString: string): T => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = markdownString.match(jsonRegex);
  const jsonString = match ? match[1] : markdownString;
  return JSON.parse(jsonString);
};

// Helper to generate markdown from structured care plan for backward compatibility
const generateMarkdownFromCarePlan = (carePlan: any, langName: string): string => {
  const sectionTitle = (title: string) => `## ${title}\n\n`;
  const item = (label: string, value?: string) => value ? `**${label}:** ${value}\n\n` : "";

  let markdown = "";

  if (carePlan.watering) {
    markdown += sectionTitle(langName === "Italian" ? "💧 Irrigazione" : "💧 Watering");
    markdown += item(langName === "Italian" ? "Frequenza" : "Frequency", carePlan.watering.frequency);
    markdown += item(langName === "Italian" ? "Quantità" : "Amount", carePlan.watering.amount);
    markdown += item(langName === "Italian" ? "Tecnica" : "Technique", carePlan.watering.technique);
    markdown += item(langName === "Italian" ? "Note stagionali" : "Seasonal Notes", carePlan.watering.seasonalNotes);
  }

  if (carePlan.sunlight) {
    markdown += sectionTitle(langName === "Italian" ? "☀️ Luce solare" : "☀️ Sunlight");
    markdown += item(langName === "Italian" ? "Requisito" : "Requirement", carePlan.sunlight.requirement);
    markdown += item(langName === "Italian" ? "Ore al giorno" : "Hours per Day", carePlan.sunlight.hoursPerDay);
    markdown += item(langName === "Italian" ? "Posizionamento" : "Placement", carePlan.sunlight.placement);
  }

  if (carePlan.soil) {
    markdown += sectionTitle(langName === "Italian" ? "🌱 Terreno" : "🌱 Soil");
    markdown += item(langName === "Italian" ? "Tipo" : "Type", carePlan.soil.type);
    markdown += item(langName === "Italian" ? "pH" : "pH", carePlan.soil.ph);
    markdown += item(langName === "Italian" ? "Miglioramenti" : "Amendments", carePlan.soil.amendments);
  }

  if (carePlan.fertilizing) {
    markdown += sectionTitle(langName === "Italian" ? "🧪 Fertilizzazione" : "🧪 Fertilizing");
    markdown += item(langName === "Italian" ? "Tipo" : "Type", carePlan.fertilizing.type);
    markdown += item(langName === "Italian" ? "Frequenza" : "Frequency", carePlan.fertilizing.frequency);
    markdown += item(langName === "Italian" ? "Periodo" : "Timing", carePlan.fertilizing.timing);
  }

  if (carePlan.pruning) {
    markdown += sectionTitle(langName === "Italian" ? "✂️ Potatura" : "✂️ Pruning");
    markdown += item(langName === "Italian" ? "Quando" : "When", carePlan.pruning.timing);
    markdown += item(langName === "Italian" ? "Come" : "How", carePlan.pruning.technique);
    markdown += item(langName === "Italian" ? "Frequenza" : "Frequency", carePlan.pruning.frequency);
  }

  if (carePlan.temperature) {
    markdown += sectionTitle(langName === "Italian" ? "🌡️ Temperatura e umidità" : "🌡️ Temperature & Humidity");
    markdown += item(langName === "Italian" ? "Range ideale" : "Ideal Range", carePlan.temperature.idealRange);
    markdown += item(langName === "Italian" ? "Resistenza" : "Hardiness", carePlan.temperature.hardiness);
    markdown += item(langName === "Italian" ? "Umidità" : "Humidity", carePlan.temperature.humidity);
  }

  if (carePlan.pests) {
    markdown += sectionTitle(langName === "Italian" ? "🐛 Parassiti e malattie" : "🐛 Pests & Diseases");
    markdown += item(langName === "Italian" ? "Comuni" : "Common", carePlan.pests.common);
    markdown += item(langName === "Italian" ? "Prevenzione" : "Prevention", carePlan.pests.prevention);
    markdown += item(langName === "Italian" ? "Trattamento" : "Treatment", carePlan.pests.treatment);
  }

  if (carePlan.repotting) {
    markdown += sectionTitle(langName === "Italian" ? "🪴 Rinvaso" : "🪴 Repotting");
    markdown += item(langName === "Italian" ? "Frequenza" : "Frequency", carePlan.repotting.frequency);
    markdown += item(langName === "Italian" ? "Quando" : "When", carePlan.repotting.timing);
    markdown += item(langName === "Italian" ? "Dimensione vaso" : "Pot Size", carePlan.repotting.potSize);
  }

  if (carePlan.harvesting) {
    markdown += sectionTitle(langName === "Italian" ? "🍎 Raccolta" : "🍎 Harvesting");
    markdown += item(langName === "Italian" ? "Quando" : "When", carePlan.harvesting.timing);
    markdown += item(langName === "Italian" ? "Tecnica" : "Technique", carePlan.harvesting.technique);
    markdown += item(langName === "Italian" ? "Conservazione" : "Storage", carePlan.harvesting.storage);
  }

  if (carePlan.warnings && carePlan.warnings.length > 0) {
    markdown += sectionTitle(langName === "Italian" ? "⚠️ Avvertenze" : "⚠️ Warnings");
    carePlan.warnings.forEach((w: string) => {
      markdown += `- ${w}\n`;
    });
    markdown += "\n";
  }

  if (carePlan.tips && carePlan.tips.length > 0) {
    markdown += sectionTitle(langName === "Italian" ? "💡 Consigli" : "💡 Tips");
    carePlan.tips.forEach((t: string) => {
      markdown += `- ${t}\n`;
    });
    markdown += "\n";
  }

  return markdown || "No care plan available.";
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body: RequestBody = await req.json();
    const { action } = body;

    switch (action) {
      case "identifyPlant": {
        const { base64Image, mimeType, language } = body;
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = {
          text: `Identify this plant. Provide its common name, a brief description, and basic care needs. Respond in ${getLanguageName(language)}.`,
        };
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common name of the plant." },
            description: { type: Type.STRING, description: "A brief description of the plant." },
            careNeeds: { type: Type.STRING, description: "Basic care needs (sunlight, water, soil)." },
          },
          required: ["name", "description", "careNeeds"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        const json = parseJsonFromMarkdown<{ name: string; description: string; careNeeds: string }>(
          response.text
        );
        return new Response(JSON.stringify(json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "searchPlantByName": {
        const { plantName, language } = body;
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common name of the plant." },
            description: { type: Type.STRING, description: "A brief description of the plant." },
            careNeeds: { type: Type.STRING, description: "Basic care needs (sunlight, water, soil)." },
            plantType: {
              type: Type.STRING,
              description: "Plant category for image generation",
              enum: ["fruit", "flower", "ornamental"],
            },
            visualDescription: {
              type: Type.STRING,
              description: "Precise visual description of this SPECIFIC variety",
            },
          },
          required: ["name", "description", "careNeeds", "plantType", "visualDescription"],
        };

        const textResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Provide a brief description and basic care needs for a ${plantName}. 

IMPORTANT: Also provide a precise visual description of this SPECIFIC variety - be very accurate about colors, shapes, and distinctive features.

Respond in ${getLanguageName(language)}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        const plantData = parseJsonFromMarkdown<{
          name: string;
          description: string;
          careNeeds: string;
          plantType: "fruit" | "flower" | "ornamental";
          visualDescription: string;
        }>(textResponse.text);

        const baseStyle =
          "The style should be clean, modern, and artistic, suitable for a high-end gardening app. Soft white or cream background. Photorealistic rendering.";
        const varietyEmphasis = `CRITICAL: This is specifically a "${plantName}" - you MUST accurately represent this exact variety with its characteristic colors, shape, and appearance. ${plantData.visualDescription}. Do NOT use generic colors or shapes from other varieties.`;

        let imagePrompt = "";
        switch (plantData.plantType) {
          case "fruit":
            imagePrompt = `A beautiful, premium botanical illustration of the ripe fruit from a ${plantName}. ${varietyEmphasis} Show the fruit as the main subject with its TRUE characteristic color, texture, and shape specific to this variety. ${baseStyle}`;
            break;
          case "flower":
            imagePrompt = `A beautiful, premium botanical illustration of the flower from a ${plantName} in full bloom. ${varietyEmphasis} Show the flower with its TRUE petal color, shape, and arrangement specific to this variety. ${baseStyle}`;
            break;
          default:
            imagePrompt = `A beautiful, premium botanical illustration of a ${plantName}, focusing on its distinctive foliage or branch structure. ${varietyEmphasis} Show the TRUE leaf color, shape, and growth pattern specific to this variety. ${baseStyle}`;
        }

        const imageResponse = await ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        });

        const base64ImageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        const imageUrl = base64ImageBytes ? `data:image/jpeg;base64,${base64ImageBytes}` : "";

        return new Response(JSON.stringify({ ...plantData, imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "generateDetailedCarePlan": {
        const { plantName, description, careNeeds, language, format = "json" } = body;
        const langName = getLanguageName(language);

        // New structured JSON schema for care plan
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            watering: {
              type: Type.OBJECT,
              properties: {
                frequency: { type: Type.STRING, description: "How often to water (e.g., '2-3 times per week')" },
                amount: { type: Type.STRING, description: "Amount of water (e.g., 'Deep soak until water drains')" },
                technique: { type: Type.STRING, description: "Watering technique (e.g., 'Water at base, avoid foliage')" },
                seasonalNotes: { type: Type.STRING, description: "Seasonal adjustments for watering" },
              },
              required: ["frequency", "amount"],
            },
            sunlight: {
              type: Type.OBJECT,
              properties: {
                requirement: { type: Type.STRING, description: "Light requirement (e.g., 'Full sun', 'Partial shade')" },
                hoursPerDay: { type: Type.STRING, description: "Recommended hours of sunlight per day" },
                placement: { type: Type.STRING, description: "Best placement suggestions" },
              },
              required: ["requirement"],
            },
            soil: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Soil type (e.g., 'Well-draining loamy soil')" },
                ph: { type: Type.STRING, description: "Preferred pH range" },
                amendments: { type: Type.STRING, description: "Recommended soil amendments" },
              },
              required: ["type"],
            },
            fertilizing: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Type of fertilizer to use" },
                frequency: { type: Type.STRING, description: "How often to fertilize" },
                timing: { type: Type.STRING, description: "Best time of year to fertilize" },
              },
              required: ["type", "frequency"],
            },
            pruning: {
              type: Type.OBJECT,
              properties: {
                timing: { type: Type.STRING, description: "When to prune" },
                technique: { type: Type.STRING, description: "How to prune" },
                frequency: { type: Type.STRING, description: "How often to prune" },
              },
            },
            temperature: {
              type: Type.OBJECT,
              properties: {
                idealRange: { type: Type.STRING, description: "Ideal temperature range" },
                hardiness: { type: Type.STRING, description: "Hardiness zone or frost tolerance" },
                humidity: { type: Type.STRING, description: "Humidity preferences" },
              },
            },
            pests: {
              type: Type.OBJECT,
              properties: {
                common: { type: Type.STRING, description: "Common pests and diseases" },
                prevention: { type: Type.STRING, description: "Prevention methods" },
                treatment: { type: Type.STRING, description: "Treatment options" },
              },
            },
            repotting: {
              type: Type.OBJECT,
              properties: {
                frequency: { type: Type.STRING, description: "How often to repot" },
                timing: { type: Type.STRING, description: "Best time to repot" },
                potSize: { type: Type.STRING, description: "Recommended pot size progression" },
              },
            },
            harvesting: {
              type: Type.OBJECT,
              properties: {
                timing: { type: Type.STRING, description: "When to harvest" },
                technique: { type: Type.STRING, description: "How to harvest" },
                storage: { type: Type.STRING, description: "Storage tips" },
              },
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important warnings or cautions",
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "General care tips",
            },
          },
          required: ["watering", "sunlight", "soil"],
        };

        const prompt = `Create a detailed care plan for a ${plantName}.
Description: ${description}
Care needs: ${careNeeds}

Respond in ${langName} with a structured JSON object following the schema.
All text values MUST be in ${langName}.

IMPORTANT: Always return the full structure, using empty strings "" for optional fields that don't apply to this plant type.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        try {
          const carePlan = parseJsonFromMarkdown<{
            watering: { frequency: string; amount: string; technique?: string; seasonalNotes?: string };
            sunlight: { requirement: string; hoursPerDay?: string; placement?: string };
            soil: { type: string; ph?: string; amendments?: string };
            fertilizing?: { type: string; frequency: string; timing?: string };
            pruning?: { timing?: string; technique?: string; frequency?: string };
            temperature?: { idealRange?: string; hardiness?: string; humidity?: string };
            pests?: { common?: string; prevention?: string; treatment?: string };
            repotting?: { frequency?: string; timing?: string; potSize?: string };
            harvesting?: { timing?: string; technique?: string; storage?: string };
            warnings?: string[];
            tips?: string[];
          }>(response.text);

          // Legacy: also return markdown for backward compatibility during transition
          if (format === "markdown") {
            const markdown = generateMarkdownFromCarePlan(carePlan, langName);
            return new Response(JSON.stringify({ markdown, structured: carePlan }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ structured: carePlan }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          // Fallback to legacy markdown format if JSON parsing fails
          return new Response(JSON.stringify({ 
            markdown: response.text,
            error: "Failed to parse structured data"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "generateAnnualCareplan": {
        const { plant, coords, weather, language } = body;
        const now = new Date();
        const year = now.getFullYear();

        let locationContext = "";
        if (coords) {
          locationContext = `User location: Latitude ${coords.latitude}, Longitude ${coords.longitude}. Determine the climate zone from these coordinates.`;
        } else if (plant.latitude && plant.longitude) {
          locationContext = `Plant location: Latitude ${plant.latitude}, Longitude ${plant.longitude}. Determine the climate zone from these coordinates.`;
        } else {
          locationContext = `No coordinates available. Assume a temperate Mediterranean climate (USDA zone 8-9).`;
        }

        const langName = getLanguageName(language);

        const prompt = `
IMPORTANT: ALL text content in the "task" and "reason" fields MUST be written in ${langName}. Do NOT use English.

You are an expert horticulturist. Generate a STRUCTURAL annual care plan for the year ${year} for the following plant.

Plant: ${plant.name}
Description: ${plant.description}
Care needs: ${plant.careNeeds}
${plant.notes ? `User notes: ${plant.notes}` : ""}
${locationContext}
${formatForecastContext(weather)}

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
            required: ["task", "reason", "category", "taskNature", "scheduledMonth", "windowStart", "windowEnd", "priority"],
          },
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        try {
          const tasks = parseJsonFromMarkdown<any[]>(response.text);
          return new Response(JSON.stringify({ tasks }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ tasks: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "adaptBiweeklyTasks": {
        const { plants, pendingTasks, completedHistory, coords, weather, language } = body;

        if (plants.length === 0) {
          return new Response(JSON.stringify({ newTasks: [], modifications: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const now = new Date();
        const plantList = plants
          .map((p: any) => `- ${p.name} (ID: ${p.id}): ${p.careNeeds}${p.notes ? ` | Notes: ${p.notes}` : ""}`)
          .join("\n");

        const pendingList = pendingTasks
          .map(
            (t: any) =>
              `- [${t.id}] ${t.plantName}: "${t.task}" (${t.category}, ${t.taskNature}) window: ${t.windowStart || "none"} to ${t.windowEnd || "none"}, priority: ${t.priority}`
          )
          .join("\n");

        const completedList = completedHistory
          .slice(0, 30)
          .map(
            (t: any) =>
              `- ${t.plantName}: "${t.task}" completed ${
                t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "recently"
              }${t.userNotes ? ` (notes: ${t.userNotes})` : ""}`
          )
          .join("\n");

        let locationContext = "";
        if (coords) {
          locationContext = `Location: Lat ${coords.latitude}, Lon ${coords.longitude}.`;
        } else {
          const plantWithCoords = plants.find((p: any) => p.latitude && p.longitude);
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

Current date: ${now.toISOString().split("T")[0]}
${locationContext}
${formatForecastContext(weather)}

Plants:
${plantList}

Pending structural tasks (next 30 days):
${pendingList || "None"}

Recently completed tasks:
${completedList || "None"}

Your job:
1. ROUTINE TASKS: Generate watering/checking tasks ONLY if weather conditions require it.
2. STRUCTURAL ADJUSTMENTS: If the forecast shows frost, extreme heat, or prolonged rain, suggest postponing or advancing windows.
3. FROST PROTECTION: If forecast shows temperatures below 0°C, generate urgent protection tasks.
4. NEVER re-propose tasks that are already completed.

Respond with a JSON object with two arrays:
- "newTasks": array of new tasks
- "modifications": array of modifications to existing tasks

Remember: "task" and "reason" MUST be in ${langName}.
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
                required: [
                  "plantId",
                  "plantName",
                  "task",
                  "reason",
                  "category",
                  "taskNature",
                  "scheduledMonth",
                  "windowStart",
                  "windowEnd",
                  "priority",
                ],
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
                required: ["taskId"],
              },
            },
          },
          required: ["newTasks", "modifications"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        try {
          const result = parseJsonFromMarkdown<{ newTasks: any[]; modifications: any[] }>(response.text);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ newTasks: [], modifications: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "chat": {
        const { messages, plants, language } = body;
        const plantContext =
          plants.length > 0
            ? `The user has the following plants in their garden: ${plants.map((p: any) => p.name).join(", ")}.`
            : "The user doesn't have any plants in their garden yet.";

        const history = messages
          .slice(0, -1)
          .map((m: any) => `${m.sender === "user" ? "User" : "Botanica"}: ${m.text}`)
          .join("\n");
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
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        return new Response(JSON.stringify({ response: response.text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
