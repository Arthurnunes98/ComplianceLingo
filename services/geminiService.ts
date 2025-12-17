import { GoogleGenAI, Type } from "@google/genai";
import { Note, QuizQuestion, TranslationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model for standard text tasks
const TEXT_MODEL = 'gemini-2.5-flash';

/**
 * specializedTranslator
 * Translates a term specifically within the context of Compliance, Risk, and Data Protection.
 */
export const translateTerm = async (term: string): Promise<TranslationResult> => {
  const prompt = `
    You are an expert English-Portuguese translator specializing in Corporate Compliance, Data Protection (GDPR/LGPD), and Risk Assessment.
    
    Translate the term: "${term}".
    
    Return the result strictly as a JSON object with this structure:
    {
      "term": "Original term capitalized correctly",
      "translation": "Portuguese translation",
      "definition": "A brief, professional definition in Portuguese context",
      "examples": ["English example sentence 1", "English example sentence 2", "English example sentence 3"]
    }
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          translation: { type: Type.STRING },
          definition: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["term", "translation", "definition", "examples"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as TranslationResult;
};

/**
 * improveNote
 * Analyzes a user's note to fix grammar or provide insights.
 */
export const improveNote = async (content: string, instruction: 'fix_grammar' | 'simplify' | 'expand'): Promise<string> => {
  let systemInstruction = "";
  
  switch (instruction) {
    case 'fix_grammar':
      systemInstruction = "You are an English teacher. Correct the grammar and spelling of the following text while maintaining the original meaning. Return only the corrected text.";
      break;
    case 'simplify':
      systemInstruction = "Simplify the following text for a non-native English speaker. Use simpler vocabulary but keep the compliance context. Return only the simplified text.";
      break;
    case 'expand':
      systemInstruction = "Expand on the following notes with relevant insights related to Compliance and Risk Assessment. Add bullet points with extra info. Return the expanded text.";
      break;
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: content,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || content;
};

/**
 * generateQuizFromNotes
 * Creates a quiz based on the user's notes and selected difficulty.
 */
export const generateQuizFromNotes = async (notes: Note[], difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): Promise<QuizQuestion[]> => {
  if (notes.length === 0) return [];

  // Combine note contents into a single context, truncating if too large
  const context = notes.map(n => `Title: ${n.title}\nContent: ${n.content}`).join("\n---\n").slice(0, 10000);

  const difficultyInstructions = {
    Easy: "Focus on basic vocabulary definitions and direct concept matching. Simple English.",
    Medium: "Include some scenario-based questions and standard industry terminology.",
    Hard: "Focus on complex scenarios, nuance between similar compliance terms, and advanced risk application."
  };

  const prompt = `
    Based strictly on the following study notes about Compliance and English, generate 5 multiple-choice questions to test the student's understanding.
    
    DIFFICULTY LEVEL: ${difficulty}
    INSTRUCTION: ${difficultyInstructions[difficulty]}

    NOTES:
    ${context}

    Return a JSON array of objects.
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate quiz");
  
  // Parse and ensure IDs are unique if AI messes up
  const questions = JSON.parse(text) as QuizQuestion[];
  return questions.map((q, idx) => ({ ...q, id: `q-${Date.now()}-${idx}` }));
};

export interface NewsItem {
  headline: string;
  summary: string;
  category: string; // e.g. "GDPR", "AML", "Cybersecurity"
  impact: 'High' | 'Medium' | 'Low';
  dateContext: string; // e.g., "2 days ago"
}

export interface NewsData {
  items: NewsItem[];
  sources: { title: string; uri: string }[];
}

/**
 * fetchComplianceNews
 * Uses Google Search grounding to find real-world news updates.
 */
export const fetchComplianceNews = async (): Promise<NewsData> => {
  const prompt = `
    Find the 6 most significant news stories or regulatory updates regarding Corporate Compliance, GDPR/LGPD, Anti-Money Laundering (AML), AI Regulation, and Financial Risk from the last 7 days.
    
    For each story, provide:
    1. A catchy headline.
    2. A short summary (max 2 sentences) suitable for an English learner.
    3. The specific category (e.g., GDPR, AML, ESG, Cyber).
    4. Impact level (High, Medium, Low).
    5. Approximate date context (e.g. "Yesterday", "2 days ago").
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            dateContext: { type: Type.STRING }
          },
          required: ["headline", "summary", "category", "impact", "dateContext"]
        }
      }
    }
  });

  const text = response.text;
  const items = text ? JSON.parse(text) as NewsItem[] : [];
  
  // Extract web sources from grounding metadata
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const rawSources = chunks
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri && web.title);

  // Deduplicate sources
  const uniqueSourcesMap = new Map();
  rawSources.forEach((s: any) => uniqueSourcesMap.set(s.uri, s));
  const sources = Array.from(uniqueSourcesMap.values()) as { title: string; uri: string }[];

  return { items, sources };
};