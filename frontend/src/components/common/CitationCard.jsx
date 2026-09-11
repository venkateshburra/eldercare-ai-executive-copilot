// src/components/common/CitationCard.jsx
import React from "react";
import { FiFileText, FiPercent } from "react-icons/fi";
import Badge from "./Badge";

export const CitationCard = ({ source, index }) => {
  const similarityPct = Math.round((source.similarity || 0) * 100);

  return (
    <div className="card-panel p-4 border-l-4 border-l-blue-700 bg-white hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
            <FiFileText className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900">
              Source [{index + 1}]: {source.documentTitle || "Clinical Record"}
            </h5>
            <span className="text-[11px] text-slate-500 capitalize">
              {source.sourceType ? source.sourceType.replace("_", " ") : "Policy"}
            </span>
          </div>
        </div>

        {source.similarity !== undefined && (
          <Badge variant="primary" size="xs">
            <FiPercent className="w-3 h-3" />
            {similarityPct}% match
          </Badge>
        )}
      </div>

      {source.content && (
        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200 italic my-2">
          "{source.content}"
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>Chunk ID: {source.chunkId ? String(source.chunkId).slice(-6) : `chk-${index + 1}`}</span>
        <span>Passage #{source.chunkIndex !== undefined ? source.chunkIndex : index}</span>
      </div>
    </div>
  );
};

export default CitationCard;
