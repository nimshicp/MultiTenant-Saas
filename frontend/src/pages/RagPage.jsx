import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  deleteRagDocument,
  fetchRagDocuments,
  getCurrentTenantSchema,
  streamRagQuestion,
  uploadDocument,
} from "../api/rag";

const RagPage = () => {
  const { user } = useAuth();
  const tenantSchema = useMemo(() => getCurrentTenantSchema(), []);
  const role = user?.role || "";
  const isAdmin = role === "ADMIN";
  const canAsk = ["ADMIN", "PROJECT_MANAGER", "EMPLOYEE", "VIEWER"].includes(role);

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
      setDocuments((prev) => prev.filter((doc) => doc.document_id !== documentId));
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
                answer: thread.answer || "Sorry, something went wrong while answering this question.",
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

  return (
    <div className="space-y-8 text-white">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#FF6B2C]/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-[#FF6B2C]/20 bg-[#FF6B2C]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B2C]">
            RAG Workspace
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
            Ask grounded questions with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">
              live answers
            </span>
            .
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-400 leading-relaxed">
            Admins manage the knowledge base. Project managers and employees get
            clean streamed answers only.
          </p>
        </div>
      </div>

      {!canAsk && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          Your role does not have RAG access.
        </div>
      )}

      {isAdmin && (
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                  Upload
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Add a PDF to your tenant
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-4 py-3 text-right">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">
                  Schema
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {tenantSchema || "No tenant detected"}
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleUpload}>
              <label className="block rounded-[24px] border border-dashed border-white/10 bg-[#0A0A0F]/50 px-5 py-8 text-center transition hover:border-[#FF6B2C]/30 hover:bg-[#FF6B2C]/5">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-white">
                    {selectedFile ? selectedFile.name : "Choose a PDF file"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                    PDF only
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={uploading || !selectedFile || !tenantSchema}
                className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition hover:shadow-xl hover:shadow-[#FF6B2C]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Indexing..." : "Upload & Index"}
              </button>
            </form>

          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                  Knowledge Base
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Document history
                </h2>
              </div>
              <button
                type="button"
                onClick={loadDocuments}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-300 transition hover:border-[#FF6B2C]/30 hover:text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0A0A0F]/60 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                  Indexed Documents
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600">
                  {loadingDocuments ? "Loading..." : `${documents.length} total`}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.document_id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {doc.filename || doc.document_id}
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                            {doc.chunks_count} chunks
                            {doc.uploaded_at
                              ? ` - ${new Date(doc.uploaded_at).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.document_id)}
                          disabled={deletingDocumentId === doc.document_id}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingDocumentId === doc.document_id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No documents indexed yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      <section className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
              Ask
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Chat with your documents
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Every answer streams token by token and only the final answer is shown.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Active Schema
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {tenantSchema || "No tenant detected"}
            </p>
          </div>
        </div>

        {canAsk ? (
          <form className="mt-8 space-y-4" onSubmit={handleAsk}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Ask something like: What is the refund policy?"
              className="w-full resize-none rounded-[24px] border border-white/10 bg-[#0A0A0F]/60 px-5 py-4 text-sm text-white outline-none transition focus:border-[#FF6B2C]/40"
            />

            <button
              type="submit"
              disabled={asking || !question.trim() || !tenantSchema}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition hover:border-[#FF6B2C]/30 hover:bg-[#FF6B2C]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {asking ? "Thinking..." : "Ask Question"}
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-[24px] border border-white/10 bg-[#0A0A0F]/60 p-5 text-sm text-gray-400">
            This role cannot ask questions in the RAG workspace.
          </div>
        )}

        <div className="mt-8 space-y-5">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="rounded-[28px] border border-white/10 bg-[#0A0A0F]/55 p-5 md:p-6"
              >
                <div className="flex justify-end">
                  <div className="max-w-[90%] rounded-[24px] bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] px-5 py-4 text-white shadow-xl shadow-[#FF6B2C]/10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
                      You
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {thread.question}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-start">
                  <div className="max-w-[95%] rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                        Assistant
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600">
                        {thread.streaming ? "Streaming..." : thread.provider || "AI"}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-100 min-h-[2rem]">
                      {thread.answer || (thread.streaming ? " " : "No answer returned.")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-gray-500">
              Ask a question to start a streamed conversation.
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm text-gray-400">
        <span className="font-bold text-white">Signed in as:</span>{" "}
        {user?.user || user?.email || "Unknown user"}
      </div>
    </div>
  );
};

export default RagPage;
