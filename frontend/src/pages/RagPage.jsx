import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  deleteRagDocument,
  fetchRagDocuments,
  getCurrentTenantSchema,
  streamRagQuestion,
  uploadDocument,
} from "../api/rag";
import {
  Upload,
  FileText,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  Loader,
  Database,
  MessageCircle,
  RefreshCw,
  Lock,
} from "lucide-react";

const RagPage = () => {
  const { user } = useAuth();
  const tenantSchema = useMemo(() => getCurrentTenantSchema(), []);
  const role = user?.role || "";
  const isAdmin = role === "ADMIN";
  const canAsk = ["ADMIN", "PROJECT_MANAGER", "EMPLOYEE"].includes(role);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadDocuments = async () => {
    if (!isAdmin || !tenantSchema) return;

    setLoadingDocuments(true);
    try {
      const result = await fetchRagDocuments();
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (err) {
      setError(err.message || "Failed to load knowledge base.");
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDocuments();
    }
  }, [isAdmin, tenantSchema]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please choose a PDF file first.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!documentId) return;

    setError("");
    setDeletingDocumentId(documentId);

    try {
      await deleteRagDocument(documentId);
      setDocuments((prev) =>
        prev.filter((doc) => doc.document_id !== documentId)
      );
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeletingDocumentId("");
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setError("Please enter a question.");
      return;
    }

    const threadId = `thread-${Date.now()}`;
    setError("");
    setAsking(true);
    setQuestion("");

    setThreads((prev) => [
      ...prev,
      {
        id: threadId,
        question: trimmed,
        answer: "",
        provider: "",
        streaming: true,
      },
    ]);

    try {
      const finalResult = await streamRagQuestion({
        question: trimmed,
        onToken: (token) => {
          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === threadId
                ? {
                    ...thread,
                    answer: `${thread.answer || ""}${token}`,
                  }
                : thread
            )
          );
        },
      });

      if (finalResult) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  answer: finalResult.answer || thread.answer,
                  provider: finalResult.provider || thread.provider,
                  streaming: false,
                }
              : thread
          )
        );
      }
    } catch (err) {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                answer:
                  thread.answer ||
                  "Sorry, something went wrong while answering this question.",
                streaming: false,
                error: true,
              }
            : thread
        )
      );
      setError(err.message || "Question failed.");
    } finally {
      setAsking(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white p-4 md:p-10 lg:p-12 font-sans relative overflow-hidden">
      {/* Background Effects with Enhanced Animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated Orange/Red Orb - Top Left */}
        <motion.div
          animate={{
            scale: [1, 1.2, 0.9, 1.1, 1],
            opacity: [0.3, 0.5, 0.2, 0.4, 0.3],
            x: [0, 50, -30, 40, 0],
            y: [0, -40, 30, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#e1571d]/20 via-[#eb6932]/10 to-transparent blur-[150px]"
        />

        {/* Animated Blue Orb - Bottom Right */}
        <motion.div
          animate={{
            scale: [0.9, 1.1, 1, 1.15, 0.9],
            opacity: [0.2, 0.4, 0.3, 0.35, 0.2],
            x: [0, -60, 40, -30, 0],
            y: [0, 50, -40, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/12 via-[#1e1b4b]/8 to-transparent blur-[140px]"
        />

        {/* Animated Secondary Orange Accent - Right Side */}
        <motion.div
          animate={{
            scale: [1, 0.8, 1.3, 0.9, 1],
            opacity: [0.25, 0.15, 0.35, 0.2, 0.25],
            x: [0, -50, 60, -40, 0],
            y: [0, 60, -50, 40, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-l from-[#e1571d]/15 via-[#ca4a15]/5 to-transparent blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* --- HERO BANNER --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18 }}
          className="rounded-[28px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-8 md:p-12 overflow-hidden shadow-xl"
        >
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[#e1571d] bg-[#e1571d]/8 text-[11px] font-semibold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-[#e1571d]/15">
              <MessageCircle size={12} className="mt-[-1px]" />
              RAG Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Ask grounded questions with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e1571d] to-[#eb6932]">
                live answers
              </span>
            </h1>
            <p className="text-[#86868d] text-base max-w-2xl leading-relaxed">
              Admins manage the knowledge base. Project managers and employees get
              clean streamed answers powered by your documents.
            </p>
          </div>
        </motion.div>

        {/* --- ACCESS CONTROL WARNING --- */}
        {!canAsk && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3"
          >
            <Lock size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">
              Your role does not have RAG access. Contact an admin to enable this
              feature.
            </p>
          </motion.div>
        )}

        {/* --- ADMIN SECTIONS --- */}
        {isAdmin && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Upload Section */}
            <motion.div
              variants={itemVariants}
              className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-6 md:p-8 shadow-xl"
            >
              <div className="space-y-2 mb-8">
                <div className="inline-flex items-center gap-2 text-[#e1571d]">
                  <Upload size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                    Upload
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Add PDF to Knowledge Base
                </h2>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2">
                  Active Tenant Schema
                </p>
                <p className="text-sm font-medium text-white">
                  {tenantSchema || "No tenant detected"}
                </p>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                <label className="block rounded-[20px] border-2 border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-10 text-center transition cursor-pointer hover:border-[#e1571d]/30 hover:bg-[#e1571d]/5 group">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                  />
                  <div className="space-y-3">
                    <FileText
                      size={32}
                      className="mx-auto text-[#e1571d] group-hover:scale-110 transition-transform"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedFile ? selectedFile.name : "Choose a PDF file"}
                      </p>
                      <p className="text-xs text-[#86868d] mt-1 uppercase tracking-wider">
                        or drag and drop
                      </p>
                    </div>
                  </div>
                </label>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={uploading || !selectedFile || !tenantSchema}
                  className="w-full bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white py-3 rounded-lg font-medium uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Upload & Index
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Knowledge Base Section */}
            <motion.div
              variants={itemVariants}
              className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4 mb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-[#e1571d]">
                    <Database size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                      Knowledge Base
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Document History
                  </h2>
                </div>
                <motion.button
                  whileHover={{ rotate: 180 }}
                  type="button"
                  onClick={loadDocuments}
                  className="p-2 rounded-lg text-[#e1571d] hover:bg-[#e1571d]/10 transition-all"
                >
                  <RefreshCw size={16} />
                </motion.button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={20} className="text-[#e1571d] animate-spin" />
                  </div>
                ) : documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <motion.div
                      key={doc.document_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:border-[#e1571d]/30 hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-[#e1571d] flex-shrink-0" />
                            <p className="text-sm font-medium text-white truncate">
                              {doc.filename || doc.document_id}
                            </p>
                          </div>
                          <p className="text-xs text-[#86868d] mt-2 uppercase tracking-wider">
                            {doc.chunks_count} chunks
                            {doc.uploaded_at
                              ? ` • ${new Date(doc.uploaded_at).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleDeleteDocument(doc.document_id)}
                          disabled={deletingDocumentId === doc.document_id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#86868d] text-sm">
                    No documents indexed yet
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                  Total Documents
                </p>
                <p className="text-lg font-semibold text-white mt-1">
                  {documents.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- CHAT SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 85,
            damping: 18,
            delay: 0.1,
          }}
          className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-6 md:p-8 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[#e1571d]">
                <MessageCircle size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                  Chat
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Chat with Your Documents
              </h2>
              <p className="text-sm text-[#86868d] mt-2">
                Every answer streams token-by-token from your knowledge base
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-right flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                Active Schema
              </p>
              <p className="text-sm font-medium text-white mt-1">
                {tenantSchema || "No tenant"}
              </p>
            </div>
          </div>

          {canAsk ? (
            <form onSubmit={handleAsk} className="space-y-5">
              <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] overflow-hidden focus-within:border-[#e1571d]/30 focus-within:bg-white/[0.05] transition-all">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  placeholder="Ask something like: What is the refund policy? Or: How do I process a return?"
                  className="w-full resize-none bg-transparent px-5 py-4 text-sm text-white outline-none placeholder-[#86868d]"
                />
                <div className="border-t border-white/[0.06] px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-[#86868d] uppercase tracking-wider">
                    {question.length} characters
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={asking || !question.trim() || !tenantSchema}
                    className="bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white px-5 py-2 rounded-lg font-medium text-xs uppercase tracking-widest shadow-[0_2px_10px_rgba(225,87,29,0.2)] hover:shadow-[0_2px_15px_rgba(225,87,29,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {asking ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        Thinking
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        Ask
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          ) : (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-300">
                This role cannot ask questions in the RAG workspace.
              </p>
            </div>
          )}

          {/* Chat Threads */}
          <motion.div
            className="mt-8 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="wait">
              {threads.length > 0 ? (
                threads.map((thread) => (
                  <motion.div
                    key={thread.id}
                    variants={itemVariants}
                    className="space-y-4"
                  >
                    {/* User Message */}
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-[85%] rounded-[20px] bg-gradient-to-r from-[#e1571d] to-[#eb6932] px-5 py-4 shadow-lg shadow-[#e1571d]/10"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-2">
                          You
                        </p>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                          {thread.question}
                        </p>
                      </motion.div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-[90%] rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/[0.06]">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                            Assistant
                          </p>
                          <div className="flex items-center gap-2">
                            {thread.streaming && (
                              <Loader
                                size={12}
                                className="text-[#e1571d] animate-spin"
                              />
                            )}
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868d]">
                              {thread.streaming
                                ? "Streaming..."
                                : thread.provider || "AI"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap min-h-[2rem]">
                          {thread.answer ||
                            (thread.streaming ? " " : "No answer returned.")}
                        </p>
                        {thread.error && (
                          <div className="mt-3 text-[10px] text-red-400 uppercase tracking-wider">
                            Error processing response
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border-2 border-dashed border-white/[0.05] bg-white/[0.02] px-6 py-12 text-center text-[#86868d]"
                >
                  <MessageCircle
                    size={32}
                    className="mx-auto mb-4 text-[#e1571d]/30"
                  />
                  <p className="text-sm font-medium">
                    Ask a question to start a conversation
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </motion.div>
        </motion.div>

        {/* --- ERROR ALERT --- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- USER INFO FOOTER --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e1571d] to-[#eb6932] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user?.user?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d]">
                Signed in as
              </p>
              <p className="text-sm font-medium text-white">
                {user?.user || user?.email || "Unknown user"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RagPage;