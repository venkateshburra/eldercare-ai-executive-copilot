// src/services/ai/gemini.service.js
import { GoogleGenAI } from "@google/genai";
import logger from "../../utils/logger.js";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
export const EMBED_MODEL  = process.env.EMBED_MODEL || "gemini-embedding-001";

// Lazy singleton — initialised on first AI call so a missing key doesn't
// crash the whole server at startup.
let _ai = null;

const getClient = () => {
  if (_ai) return _ai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not set in .env. " +
      "Get a key from https://aistudio.google.com/app/apikey and add it to your .env file."
    );
  }

  _ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  return _ai;
};

// ── Text generation ─────────────────────────────────────────────────────────
export const generateAIResponse = async (prompt, modelName = GEMINI_MODEL) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    logger.error("Gemini generateContent error:", error.message);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
};

// ── Embedding generation ────────────────────────────────────────────────────
export const generateEmbedding = async (text) => {
  try {
    const ai = getClient();
    const response = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: text,
      config: { outputDimensionality: 768 },
    });
    return response.embeddings[0].values;
  } catch (error) {
    logger.error("Gemini embedContent error:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};
