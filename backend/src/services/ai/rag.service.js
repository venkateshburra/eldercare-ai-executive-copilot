// src/services/ai/rag.service.js
// Full RAG pipeline: embed query → cosine similarity → retrieve chunks → build prompt → Gemini answer → citations
import AIChunk from "../../models/AIChunk.js";
import AIDocument from "../../models/AIDocument.js";
import { generateAIResponse, generateEmbedding } from "./gemini.service.js";

/**
 * Cosine similarity between two equal-length vectors.
 */
const cosineSimilarity = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

/**
 * Execute the full RAG pipeline for a user question.
 *
 * @param {string} organizationId
 * @param {string} question
 * @param {object} options
 * @param {number} [options.topK=5]             - Number of chunks to retrieve
 * @param {number} [options.minSimilarity=0.55]  - Minimum cosine similarity threshold
 */
export const executeRAG = async (organizationId, question, options = {}) => {
  const { topK = 5, minSimilarity = 0.55 } = options;

  // 1. Embed the question
  const queryEmbedding = await generateEmbedding(question);

  // 2. Retrieve ALL chunks for this org that have embeddings
  // (In production with large datasets, replace with MongoDB Atlas Vector Search)
  const chunks = await AIChunk.find({
    organizationId,
    embedding: { $exists: true, $not: { $size: 0 } },
  })
    .select("content chunkIndex documentId metadata embedding")
    .lean();

  if (!chunks.length) {
    return {
      answer: "No knowledge base documents have been indexed for this organisation. Please upload and embed documents first.",
      sources: [],
      confidence: 0,
      isInsufficient: true,
    };
  }

  // 3. Score and rank
  const scored = chunks
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter(c => c.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  if (!scored.length) {
    return {
      answer: "The available knowledge base does not contain sufficient evidence to answer this question confidently.",
      sources: [],
      confidence: 0,
      isInsufficient: true,
    };
  }

  // 4. Fetch parent document titles for citations
  const documentIds = [...new Set(scored.map(c => c.documentId.toString()))];
  const documents = await AIDocument.find({ _id: { $in: documentIds }, organizationId })
    .select("title sourceType")
    .lean();
  const docMap = Object.fromEntries(documents.map(d => [d._id.toString(), d]));

  // 5. Build context block
  const contextBlock = scored
    .map((c, i) => `[Source ${i + 1}] (${docMap[c.documentId.toString()]?.title || "Unknown"}):\n${c.content}`)
    .join("\n\n---\n\n");

  // 6. Build Gemini prompt
  const prompt = `
You are an expert knowledge assistant for an elderly care organisation.

Answer the user's question ONLY using the evidence provided below.
Do NOT invent facts.
If the evidence is insufficient, say so explicitly.
At the end of your answer, list the source numbers you used (e.g. [Source 1], [Source 3]).

USER QUESTION:
${question}

EVIDENCE:
${contextBlock}

Return ONLY valid JSON in exactly this format:

{
  "answer": "Your direct answer based on the evidence",
  "confidence": 0.85,
  "usedSources": [1, 2],
  "limitations": ["Any missing information that limits the answer"]
}

Rules:
1. confidence must be between 0 and 1.
2. usedSources must list the [Source N] numbers actually used.
3. If you cannot answer from the evidence, set confidence to 0 and explain in answer.
4. Return JSON only. No markdown.
`;

  const rawResponse = await generateAIResponse(prompt);

  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    // Fallback if Gemini returns markdown-wrapped JSON
    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
    }
    if (!parsed) {
      return { answer: rawResponse, sources: [], confidence: 0, isInsufficient: false };
    }
  }

  // 7. Build citations
  const usedIndices = (parsed.usedSources || []).map(n => n - 1).filter(i => i >= 0 && i < scored.length);
  const sources = usedIndices.map(i => {
    const chunk = scored[i];
    const doc = docMap[chunk.documentId.toString()];
    return {
      documentId:    chunk.documentId,
      documentTitle: doc?.title || "Unknown",
      sourceType:    doc?.sourceType || "other",
      chunkId:       chunk._id,
      chunkIndex:    chunk.chunkIndex,
      similarity:    Math.round(chunk.similarity * 1000) / 1000,
    };
  });

  return {
    answer:        parsed.answer,
    confidence:    parsed.confidence ?? 0,
    limitations:   parsed.limitations || [],
    sources,
    isInsufficient: (parsed.confidence ?? 0) === 0,
  };
};
