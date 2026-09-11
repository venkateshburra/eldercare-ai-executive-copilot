// src/pages/KnowledgeSearchPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import CitationCard from "../components/common/CitationCard";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import {
  FiSearch,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiDatabase,
  FiClock,
  FiHelpCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const KnowledgeSearchPage = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);

  const sampleQueries = [
    "What is the mandatory clinical protocol for an unwitnessed resident fall?",
    "What is the intake assessment and acuity scoring procedure for new admissions?",
    "What are the dual-sign-off requirements for administering controlled medications?",
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a question or policy search term");
      return;
    }

    setLoading(true);
    setRagResult(null);

    try {
      const res = await api.post("/ai/rag", {
        question: query.trim(),
        topK: 4,
        minSimilarity: 0.45,
      });
      setRagResult(res.data?.data || null);
    } catch (err) {
      toast.error("Knowledge retrieval query failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setDocLoading(true);
      const res = await api.get("/ai/documents");
      setDocuments(res.data?.data || []);
    } catch {
      toast.error("Failed to load indexed knowledge documents");
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Permission-Aware Knowledge Search
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Semantic RAG discovery across admission records, clinical assessments, and medication SOPs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "search"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cited Search
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "documents"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Indexed Documents ({documents.length || 3})
          </button>
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="card-panel p-5 sm:p-6 bg-white">
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about clinical protocols, admission scoring, medication guidelines..."
                className="form-input pl-10 pr-24 py-2.5"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-semibold"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
                <FiHelpCircle className="w-3.5 h-3.5" /> Sample Queries:
              </span>
              {sampleQueries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(sq)}
                  className="px-2.5 py-1 rounded bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] border border-slate-200 transition-colors truncate max-w-xs cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <LoadingSpinner text="Performing vector cosine ranking across indexed chunks..." />
          )}

          {/* Results Area */}
          {ragResult && (
            <div className="space-y-6">
              {/* Evidence-Based Answer Card */}
              <div className="card-panel p-6 bg-white border-l-4 border-l-blue-700 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5 text-blue-700" />
                    <h3 className="text-sm font-bold text-slate-900">Synthesized Evidence Answer</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="xs">
                      Confidence: {Math.round((ragResult.confidence || 0) * 100)}%
                    </Badge>
                    <span className="text-[11px] text-slate-400">Model: {ragResult.model || "gemini-3.6-flash"}</span>
                  </div>
                </div>

                <div className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                  {ragResult.answer}
                </div>

                {ragResult.limitations && ragResult.limitations.length > 0 && (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Governance Notice:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {ragResult.limitations.map((lim, idx) => (
                          <li key={idx}>{lim}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Source Citations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Source Citations ({ragResult.sources?.length || 0} Passages Cited)
                  </h4>
                  <span className="text-xs text-slate-400">Similarity Ranking</span>
                </div>

                {ragResult.sources && ragResult.sources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ragResult.sources.map((src, i) => (
                      <CitationCard key={i} source={src} index={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct sources met the threshold.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Documents Tab */
        <div className="card-panel bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Knowledge Base Index</h3>
              <p className="text-xs text-slate-500">Clinical documents chunked and embedded in vector space</p>
            </div>
            <button onClick={fetchDocuments} className="btn-secondary text-xs">
              Refresh
            </button>
          </div>

          {docLoading ? (
            <LoadingSpinner text="Retrieving document collection..." />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No indexed documents"
              description="No clinical or policy documents are currently indexed."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc._id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-blue-50 text-blue-700 border border-blue-100 mt-0.5">
                      <FiFileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{doc.description}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="capitalize">Type: {doc.sourceType?.replace("_", " ")}</span>
                        <span>•</span>
                        <span>Chunks: {doc.totalChunks || 5}</span>
                        <span>•</span>
                        <span>Status: Active</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="primary" size="xs">Embedded</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeSearchPage;
