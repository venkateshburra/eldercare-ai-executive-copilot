// src/pages/BriefingsDecisionsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import {
  FiCheckSquare,
  FiFileText,
  FiCheck,
  FiX,
  FiCornerUpRight,
  FiPlus,
  FiClock,
  FiUser,
  FiShield,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export const BriefingsDecisionsPage = () => {
  const { hasPermission } = useAuth();
  const canManageDecisions = hasPermission("decisions.manage");
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Executive Briefing state
  const [briefing, setBriefing] = useState(null);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

  // Action Modal State (Approve / Reject / Override)
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [actionOutcome, setActionOutcome] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Create Decision Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("staffing");
  const [newPriority, setNewPriority] = useState("medium");
  const [newRationale, setNewRationale] = useState("");
  const [creatingDecision, setCreatingDecision] = useState(false);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/decisions");
      setDecisions(res.data?.data || []);
    } catch {
      toast.error("Failed to load decision logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleGenerateBriefing = async () => {
    try {
      setGeneratingBriefing(true);
      const res = await api.post("/ai/chat", {
        message: "Generate a daily morning executive operational briefing for SilverCare Senior Living summarizing census, high fall risks, shift staffing, and open decisions.",
      });

      const text = res.data?.data?.result?.answer || "Executive briefing synthesized successfully.";
      setBriefing({
        date: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        content: text,
      });
      toast.success("Executive briefing generated!");
    } catch {
      toast.error("Failed to generate AI executive briefing");
    } finally {
      setGeneratingBriefing(false);
    }
  };

  const handleDecisionAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    setSubmittingAction(true);
    const { decision, actionType } = actionModal;

    try {
      if (actionType === "approve") {
        await api.patch(`/decisions/${decision._id}/approve`);
        toast.success("Decision approved");
      } else if (actionType === "reject") {
        if (!actionReason.trim()) {
          toast.error("Rejection reason is required");
          setSubmittingAction(false);
          return;
        }
        await api.patch(`/decisions/${decision._id}/reject`, { reason: actionReason.trim() });
        toast.success("Decision rejected");
      } else if (actionType === "override") {
        if (!actionReason.trim() || !actionOutcome.trim()) {
          toast.error("Reason and new outcome are required for an override");
          setSubmittingAction(false);
          return;
        }
        await api.patch(`/decisions/${decision._id}/override`, {
          reason: actionReason.trim(),
          outcome: actionOutcome.trim(),
        });
        toast.success("Decision overridden with justification log");
      }

      setActionModal(null);
      setActionReason("");
      setActionOutcome("");
      fetchDecisions();
    } catch {
      toast.error(`Failed to execute ${actionType}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setCreatingDecision(true);
    try {
      await api.post("/decisions", {
        title: newTitle.trim(),
        description: newDescription.trim(),
        decisionType: newType,
        priority: newPriority,
        rationale: newRationale.trim(),
      });
      toast.success("New decision item registered");
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewRationale("");
      fetchDecisions();
    } catch {
      toast.error("Failed to create decision");
    } finally {
      setCreatingDecision(false);
    }
  };

  const statusVariant = (status) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "danger";
      case "overridden": return "warning";
      case "pending": return "primary";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Executive Briefings & Governed Decisions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational morning synthesis, human-in-the-loop approvals, and immutable override audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateBriefing}
            disabled={generatingBriefing}
            className="btn-primary"
          >
            <FiFileText className="w-4 h-4" />
            {generatingBriefing ? "Synthesizing..." : "Generate AI Daily Briefing"}
          </button>
          {canManageDecisions && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-secondary"
            >
              <FiPlus className="w-4 h-4" />
              New Decision
            </button>
          )}
        </div>
      </div>

      {/* AI Daily Briefing Output Box */}
      {briefing && (
        <div className="card-panel p-6 bg-white border-l-4 border-l-blue-700 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Daily Operational Briefing • {briefing.date}
              </h3>
            </div>
            <button
              onClick={() => setBriefing(null)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-md border border-slate-200">
            {briefing.content}
          </div>
        </div>
      )}

      {/* Governed Decision Registry Table */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Decision Registry & Human-in-the-Loop Actions</h3>
            <p className="text-xs text-slate-500">Every material clinical and operational action with full audit trail</p>
          </div>
          <Badge variant="primary" size="xs">
            {decisions.length} Active Records
          </Badge>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading decisions..." />
        ) : decisions.length === 0 ? (
          <EmptyState
            title="No decisions logged"
            description="Create a new decision item or wait for AI operational recommendations."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Decision Title</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Priority</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Registered</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Governed Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decisions.map((dec) => (
                  <tr key={dec._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-[16px] text-slate-900">{dec.title}</p>
                      <p className="text-[14px] text-slate-500 line-clamp-1 mt-0.5">{dec.description}</p>
                      {dec.rationale && (
                        <p className="text-[12px] text-blue-700 mt-1 italic">
                          Rationale: {dec.rationale}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[16px] capitalize text-slate-600">
                      {dec.decisionType?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-[16px] capitalize">
                      <span
                        className={`font-semibold ${
                          dec.priority === "urgent"
                            ? "text-rose-600"
                            : dec.priority === "high"
                            ? "text-amber-600"
                            : "text-slate-600"
                        }`}
                      >
                        {dec.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[16px]">
                      <Badge variant={statusVariant(dec.status)} size="xs">
                        {dec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[16px] text-slate-500">
                      {new Date(dec.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {dec.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActionModal({ decision: dec, actionType: "approve" })}
                            className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Approve Recommendation"
                          >
                            <FiCheck className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ decision: dec, actionType: "override" })}
                            className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Override Recommendation"
                          >
                            <FiCornerUpRight className="w-3.5 h-3.5" /> Override
                          </button>
                        </div>
                      ) : (
                        <span className="text-[14px] text-slate-400 capitalize">
                          Logged ({dec.status})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Confirmation / Reason Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 capitalize mb-1">
              Confirm {actionModal.actionType} Action
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Decision: <strong className="text-slate-800">{actionModal.decision.title}</strong>
            </p>

            <form onSubmit={handleDecisionAction} className="space-y-4">
              {actionModal.actionType !== "approve" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Justification / Clinical Rationale *
                  </label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter explicit clinical or operational reason for audit trail..."
                    className="form-input text-xs"
                    required
                  />
                </div>
              )}

              {actionModal.actionType === "override" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Action Outcome Authorized *
                  </label>
                  <textarea
                    rows={2}
                    value={actionOutcome}
                    onChange={(e) => setActionOutcome(e.target.value)}
                    placeholder="E.g., Authorized 5-room radar trial in Wing B instead of blanket rollout."
                    className="form-input text-xs"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="btn-primary text-xs"
                >
                  {submittingAction ? "Logging..." : `Execute ${actionModal.actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Decision Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Create New Decision Record
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a material staffing, clinical, or operational item for governance review.
            </p>

            <form onSubmit={handleCreateDecision} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g., Staff reallocation for Wing A weekend shift"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed description of the proposed operational change..."
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="staffing">Staffing</option>
                    <option value="resident_care">Resident Care</option>
                    <option value="operations">Operations</option>
                    <option value="financial">Financial</option>
                    <option value="safety">Safety</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical / Strategic Rationale</label>
                <input
                  type="text"
                  value={newRationale}
                  onChange={(e) => setNewRationale(e.target.value)}
                  placeholder="Justification for leadership review..."
                  className="form-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDecision}
                  className="btn-primary text-xs"
                >
                  {creatingDecision ? "Saving..." : "Create Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefingsDecisionsPage;
