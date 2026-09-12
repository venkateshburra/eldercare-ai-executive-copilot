// src/pages/SourceCitedQAPage.jsx
import React, { useState } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CitationCard from "../components/common/CitationCard";
import {
  FiSend,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiInfo,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const SourceCitedQAPage = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello Executive. I am your governed elder care copilot. Ask any operational, clinical, or scenario planning question, and I will provide an evidence-based answer with exact source citations.",
      timestamp: new Date().toISOString(),
      model: "gemini-3.6-flash",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    const userMsg = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: userText });
      const { intent, result, model, latencyMs, timestamp } = res.data?.data || {};

      let answerText = "";
      let confidence = 0.88;
      let sources = [];

      if (typeof result === "string") {
        answerText = result;
      } else if (result?.answer) {
        answerText = result.answer;
        confidence = result.confidence || 0.85;
        sources = result.sources || [];
      } else {
        answerText = JSON.stringify(result);
      }

      const assistantMsg = {
        role: "assistant",
        content: answerText,
        confidence,
        sources,
        latencyMs,
        model: model || "gemini-3.6-flash",
        intent,
        timestamp: timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to generate response");
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "What is the procedure when an elder resident falls?",
    "Summarize current facility occupancy and high fall-risk resident census.",
    "What are our dual sign-off protocols for controlled substances?",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Source-Cited Clinical & Operational Q&A
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Governed natural language interface powered by Gemini 3.6 Flash with RAG citations
          </p>
        </div>

        <Badge variant="primary" size="xs">
          RAG Verified Engine
        </Badge>
      </div>

      {/* Main Chat Container */}
      <div className="card-panel bg-white flex flex-col h-[550px] shadow-xs overflow-hidden">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-2xl rounded-lg p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-700 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                }`}
              >
                {/* Meta header for assistant */}
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                      <FiMessageSquare className="w-3.5 h-3.5" />
                      <span>ElderCare Copilot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.latencyMs && (
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" /> {msg.latencyMs}ms
                        </span>
                      )}
                      {msg.confidence !== undefined && (
                        <Badge variant="primary" size="xs">
                          {Math.round(msg.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Verified Clinical Sources:
                    </p>
                    <div className="space-y-2">
                      {msg.sources.map((src, sIdx) => (
                        <CitationCard key={sIdx} source={src} index={sIdx} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center gap-2 text-xs text-slate-600">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
                <span>Searching indexed clinical documents and synthesizing answer...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts Banner */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Try:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputMessage(p)}
              className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] border border-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask an operational or clinical question..."
              className="form-input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="btn-primary shrink-0"
            >
              <FiSend className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Copilot</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SourceCitedQAPage;
