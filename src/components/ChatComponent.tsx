"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Trash2,
  RefreshCw,
  MessageCircle,
  FileCheck,
  Info,
  ChevronDown,
  UploadCloud,
  Cpu,
  Settings,
  Sparkles,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage, DocumentMeta } from "../types";

interface ChatComponentProps {
  documents: DocumentMeta[];
}

export default function ChatComponent({ documents }: ChatComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "gemini";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedDocIdFilter, setSelectedDocIdFilter] = useState<string>("all");

  // Local Ollama configurations persisting to localStorage
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3");
  const [showOllamaSettings, setShowOllamaSettings] = useState(false);

  // Sync settings with browser storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHost = window.localStorage.getItem("wise_ollama_host");
      const savedModel = window.localStorage.getItem("wise_ollama_model");
      if (savedHost) setOllamaHost(savedHost);
      if (savedModel) setOllamaModel(savedModel);
    }
  }, []);

  const updateOllamaHost = (val: string) => {
    setOllamaHost(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wise_ollama_host", val);
    }
  };

  const updateOllamaModel = (val: string) => {
    setOllamaModel(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wise_ollama_model", val);
    }
  };

  // Drag and drop / upload states integrated into the Docs left panel
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadError != null || uploadSuccess != null) {
      const timer = setTimeout(() => {
        setUploadError(null);
        setUploadSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError, uploadSuccess]);

  // Autoscroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Sync state if selected document was deleted
  useEffect(() => {
    if (
      selectedDocIdFilter !== "all" &&
      !documents.some((d) => d.id === selectedDocIdFilter)
    ) {
      setSelectedDocIdFilter("all");
    }
  }, [documents, selectedDocIdFilter]);

  // Handle Drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  // Upload file parser logic
  const uploadFile = async (file: File) => {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".txt", ".docx"].includes(extension)) {
      setUploadError("Strictly select PDF, TXT, or DOCX documents.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process document context.");
      }
      setUploadSuccess(data.successMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during verification.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  // Delete individual doc
  const deleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedDocIdFilter === id) {
          setSelectedDocIdFilter("all");
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to remove document:", err);
    }
  };

  // Clear all docs
  const clearAllDocs = async () => {
    if (
      confirm("Are you sure you want to clear your current database pipeline?")
    ) {
      try {
        const res = await fetch("/api/documents", {
          method: "DELETE",
        });
        if (res.ok) {
          setMessages([]);
          setSelectedDocIdFilter("all");
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to clear documents:", err);
      }
    }
  };

  // Submit chat query
  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsSending(true);

    const historyPayload = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: historyPayload,
          docId: selectedDocIdFilter,
          provider,
          ollamaModel,
          ollamaHost,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "RAG engine fails response synthesis.");
      }

      let responseText = "";

      if (data.isLocal) {
        // Direct browser network call to local Ollama (bypasses Server container limit, avoids tunnel setup)
        try {
          const localRes = await fetch(`${ollamaHost}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ollamaModel,
              prompt: `${data.systemInstruction}\n\n${data.localPrompt}`,
              stream: false,
            }),
          });

          if (!localRes.ok) {
            throw new Error(
              `Local Ollama service on ${ollamaHost} returned status ${localRes.status}`,
            );
          }

          const localData = await localRes.json();
          responseText =
            localData.response ||
            "No response received from local Ollama model.";
        } catch (localErr: any) {
          const helpErr =
            `Could not connect to your local Ollama LLM at "${ollamaHost}" using model "${ollamaModel}".\n\n` +
            `Troubleshooting checklist:\n` +
            `1. Make sure Ollama is active on your computer.\n` +
            `2. Start Ollama with CORS/Origins enabled to allow browser requests:\n` +
            `   • Mac/Linux: OLLAMA_ORIGINS="*" ollama serve\n` +
            `   • Windows: (Close Ollama from taskbar tray, then run in terminal)\n` +
            `     set OLLAMA_ORIGINS=* && ollama serve\n` +
            `3. Run "ollama pull ${ollamaModel}" to verify the model is downloaded.`;
          throw new Error(helpErr);
        }
      } else {
        responseText = data.response;
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setChatError(err.message || "Unable to complete search request.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      id="workspace-section"
      className="bg-white rounded-[24px] border border-[#0e0f0c]/5 shadow-lg overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-h-[630px]"
    >
      {/* Workspace Left Column: Active knowledge sources with integrated Drag & Drop file upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`lg:col-span-4 p-6 flex flex-col space-y-5 transition-all relative ${
          isDragging ? "bg-[#e2f6d5]/60" : "bg-[#e8ebe6]/40"
        } border-r border-[#0e0f0c]/5`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx"
          className="hidden"
        />

        {/* Highlight Overlay on Drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#e2f6d5]/90 z-20 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-16 h-16 bg-[#9fe870] rounded-full flex items-center justify-center shadow-md mb-3 animate-pulse">
                <UploadCloud className="w-8 h-8 text-[#0e0f0c]" />
              </div>
              <p className="text-sm font-black text-[#0e0f0c]">
                Drop documents here
              </p>
              <p className="text-xs text-[#454745] mt-1 font-semibold">
                Immediate pipeline indexing (.pdf, .txt, .docx)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0e0f0c]" />
            <h3 className="font-extrabold text-lg text-[#0e0f0c] tracking-tight">
              Documents
            </h3>
          </div>
          {documents.length > 0 && (
            <button
              onClick={clearAllDocs}
              className="text-xs font-semibold text-[#d03238] hover:text-[#a72027] flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Dynamic drop area or quick interactive stats indicator inside documents pipeline */}
        {documents.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 h-64 border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all bg-white hover:bg-[#9fe870]/5 ${
              isDragging
                ? "border-[#2ead4b] bg-[#e2f6d5]/20"
                : "border-[#0e0f0c]/10"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2.5">
                <RefreshCw className="w-8 h-8 text-[#0e0f0c] animate-spin" />
                <p className="text-sm font-bold text-[#0e0f0c]">
                  Parsing content...
                </p>
                <span className="text-[10px] text-[#868685] font-semibold">
                  Splitting into chunks
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#cbd0c9]/30 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-[#0e0f0c]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0e0f0c] leading-tight">
                    Drag & Drop documents here
                  </p>
                  <p className="text-[11px] text-[#2ead4b] font-bold underline mt-1">
                    or browse files to upload
                  </p>
                  <p className="text-[10px] text-[#868685] mt-2 leading-relaxed">
                    PDF, Word DOCX, or raw TXT
                    <br />
                    up to 10MB index frame
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {/* Integrated micro drag-trigger for existing index */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#0e0f0c]/15 rounded-xl p-3 text-center cursor-pointer bg-white hover:bg-[#9fe870]/5 hover:border-[#0e0f0c]/30 transition-all flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#0e0f0c] animate-spin" />
                  <span className="text-[11px] font-bold text-[#000000]">
                    Indexing new source...
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-[#2ead4b]" />
                  <span className="text-[11px] font-bold text-[#454745] hover:text-[#0e0f0c]">
                    Drag or click to add files
                  </span>
                </>
              )}
            </div>

            <p className="text-[10.5px] text-[#868685] font-semibold tracking-wide uppercase">
              Current Index Pipeline ({documents.length})
            </p>
          </div>
        )}

        {/* Upload error display inside panel */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-start space-x-2 border border-red-200"
            >
              <Info className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{uploadError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message display inside panel */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-medium flex items-start space-x-2 border border-green-200"
            >
              <Check className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
              <span>{uploadSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document list card structure */}
        {documents.length > 0 && (
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px] pr-1">
            <div className="space-y-2">
              {/* Select All Filter */}
              <button
                onClick={() => setSelectedDocIdFilter("all")}
                className={`w-full text-left p-3 rounded-full transition-all border flex items-center justify-between cursor-pointer ${
                  selectedDocIdFilter === "all"
                    ? "bg-white border-[#0e0f0c] font-bold text-[#0e0f0c] shadow-xs"
                    : "border-transparent bg-white/40 font-medium text-[#454745] hover:bg-[#cbd0c9]/40"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2ead4b]" />
                  <span className="text-xs font-semibold tracking-wide">
                    All Activated Sources
                  </span>
                </div>
                <span className="text-[10px] bg-[#0e0f0c]/5 px-2 py-0.5 rounded-full font-bold">
                  {documents.length}
                </span>
              </button>

              <AnimatePresence>
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-2.5 rounded-full bg-white border flex flex-row items-center justify-between space-y-0 relative group hover:shadow-xs transition-all cursor-pointer ${
                      selectedDocIdFilter === doc.id
                        ? "border-[#0e0f0c] ring-1 ring-[#0e0f0c]"
                        : "border-[#0e0f0c]/5"
                    }`}
                    onClick={() => setSelectedDocIdFilter(doc.id)}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-8">
                      <div className="w-7 h-7 rounded-full bg-[#cbd0c9]/25 flex items-center justify-center shrink-0 border border-[#0e0f0c]/5">
                        <span
                          className={`text-[8px] font-black ${
                            doc.type === "PDF"
                              ? "text-red-600"
                              : doc.type === "DOCX"
                                ? "text-blue-600"
                                : "text-gray-600"
                          }`}
                        >
                          {doc.type}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#0e0f0c] truncate group-hover:text-[#2ead4b] transition-colors">
                          {doc.name}
                        </h4>
                        <p className="text-[9px] text-[#868685]">
                          {(doc.size / 1024).toFixed(1)} KB · {doc.chunksCount}{" "}
                          chunks
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDoc(doc.id);
                      }}
                      className="text-[#868685] hover:text-[#d03238] transition-colors p-1 rounded-full hover:bg-red-50 cursor-pointer absolute right-2"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {provider === "ollama" && (
          <div className="bg-white p-4 rounded-[20px] border border-[#0e0f0c]/5 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-[#0e0f0c] font-bold">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-[#2ead4b]" />
                <span>Ollama LLM Config</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOllamaSettings(!showOllamaSettings)}
                className="text-xs text-[#868685] hover:text-[#0e0f0c] p-1 rounded hover:bg-[#e8ebe6] transition-colors"
                title="Configure Ollama connection details"
              >
                <Settings
                  className={`w-3.5 h-3.5 transition-transform ${showOllamaSettings ? "rotate-45" : ""}`}
                />
              </button>
            </div>

            <p className="text-[10px] text-[#868685] leading-relaxed">
              Configure connection parameters for local or remote Ollama
              instances.
            </p>

            <div className="bg-[#e8ebe6]/40 p-2.5 rounded-xl text-[11px] font-semibold text-[#0e0f0c] flex items-center justify-between">
              <span>
                Model:{" "}
                <span className="font-bold underline text-[#2ead4b]">
                  {ollamaModel}
                </span>
              </span>
              <span className="text-[9px] bg-[#9fe870] text-[#0e0f0c] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                Activated
              </span>
            </div>

            <AnimatePresence>
              {showOllamaSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-1 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#868685] uppercase tracking-wider block">
                      Ollama API Host
                    </label>
                    <input
                      type="text"
                      value={ollamaHost}
                      onChange={(e) => updateOllamaHost(e.target.value)}
                      placeholder="e.g. http://localhost:11434"
                      className="w-full text-xs font-semibold border border-[#0e0f0c]/10 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#9fe870] bg-white text-[#0e0f0c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#868685] uppercase tracking-wider block">
                      Active Model Name
                    </label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => updateOllamaModel(e.target.value)}
                      placeholder="e.g. llama3, mistral"
                      className="w-full text-xs font-semibold border border-[#0e0f0c]/10 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#9fe870] bg-white text-[#0e0f0c]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="bg-white p-4 rounded-[20px] border border-[#0e0f0c]/5 text-xs text-[#454745] space-y-1.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-[#0e0f0c] font-bold">
            <Info className="w-3.5 h-3.5 text-[#2ead4b]" />
            <span>How RAG works</span>
          </div>
          <p className="leading-relaxed text-[#868685] text-[10.5px]">
            {provider === "ollama"
              ? "Your search query prioritizes semantic chunks securely parsed on our server, which are immediately sent back to your local Ollama instance for local contextual execution."
              : "Your queries prioritize matching overlapping text chunks securely parsed on our server, which are immediately passed to Gemini 3.5 Flash for contextual answer synthesis."}
          </p>
        </div>
      </div>

      {/* Workspace Right Column: Real-time editorial chat interface */}
      <div className="lg:col-span-8 p-6 flex flex-col h-[550px] lg:h-[650px] bg-white relative justify-between">
        {/* Header segment of the active chat */}
        <header className="border-b border-[#0e0f0c]/5 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e2f6d5] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2ead4b"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-lg text-[#0e0f0c] leading-none">
                  {messages.length > 0
                    ? "Analyzing Documents"
                    : "Ready to Interrogate"}
                </h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    provider === "ollama"
                      ? "bg-amber-100 text-amber-900 border border-[#b45309]/10"
                      : "bg-[#e2f6d5] text-[#054d28]"
                  }`}
                >
                  {provider === "ollama"
                    ? `Ollama (${ollamaModel})`
                    : "Gemini 3.5 Flash"}
                </span>
              </div>
              <p className="text-xs text-[#868685]">
                {selectedDocIdFilter === "all"
                  ? `Searching all ${documents.length} sources`
                  : `Filtering query to: ${documents.find((d) => d.id === selectedDocIdFilter)?.name}`}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs font-semibold text-[#868685] hover:text-[#0e0f0c] flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          )}
        </header>

        {/* Chats dynamic panel */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#cbd0c9]/30 flex items-center justify-center text-[#2ead4b]">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight text-[#0e0f0c]">
                  Operational workspace is primed
                </h4>
                <p className="text-xs text-[#868685] mt-1 max-w-sm font-semibold">
                  {documents.length > 0
                    ? "Enter your question below to extract, prioritize, or consult your document context directly."
                    : "Upload local files or drag them directly into the Document tab on the left to activate conversation."}
                </p>
              </div>

              {documents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setUserInput(
                        "Can you summarize the main findings in these documents?",
                      )
                    }
                    className="text-[11px] bg-[#e8ebe6] hover:bg-[#cbd0c9] text-[#0e0f0c] px-3.5 py-1.5 rounded-full font-bold transition-all border border-[#0e0f0c]/5 cursor-pointer"
                  >
                    "Can you summarize findings?"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUserInput(
                        "What are the key statistics or figures mentioned?",
                      )
                    }
                    className="text-[11px] bg-[#e8ebe6] hover:bg-[#cbd0c9] text-[#0e0f0c] px-3.5 py-1.5 rounded-full font-bold transition-all border border-[#0e0f0c]/5 cursor-pointer"
                  >
                    "What key figures are mentioned?"
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-[85%] ${
                    msg.sender === "user"
                      ? "self-end flex-row-reverse ml-auto"
                      : "items-start"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-black text-white"
                        : "bg-[#9fe870] text-[#0e0f0c]"
                    }`}
                  >
                    {msg.sender === "user" ? "AA" : "AI"}
                  </div>

                  <div
                    className={`p-4 rounded-[24px] ${
                      msg.sender === "user"
                        ? "bg-[#9fe870] text-[#0e0f0c] rounded-tr-none font-semibold text-sm shadow-xs"
                        : "bg-[#f9fbf8] text-[#0e0f0c] rounded-tl-none border border-[#0e0f0c]/5 text-sm shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>

                    {msg.sender === "assistant" &&
                      msg.citations &&
                      msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#0e0f0c]/5 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#868685] uppercase tracking-wider block">
                            Active Reference Citations ({msg.citations.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(
                              new Set(msg.citations.map((c) => c.docName)),
                            ).map((docName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center space-x-1 bg-[#e2f6d5] text-[#054d28] px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#2bad4b]/10"
                              >
                                <FileCheck className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[150px]">
                                  {docName}
                                </span>
                              </span>
                            ))}
                          </div>

                          <details className="group mt-2">
                            <summary className="text-[10px] font-bold text-[#2ead4b] cursor-pointer hover:underline flex items-center space-x-1 outline-none">
                              <span>Inspect exact text mappings</span>
                              <ChevronDown className="w-3 h-3 transform group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-2 bg-white border border-[#0e0f0c]/5 rounded-[16px] p-3 space-y-2 max-h-[150px] overflow-y-auto w-full">
                              {msg.citations.map((cit, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="text-[11px] text-[#454745] border-l-2 border-[#2ead4b] pl-2.5"
                                >
                                  <span className="font-bold block text-[#0e0f0c]">
                                    {cit.docName}:
                                  </span>
                                  <span className="italic block mt-0.5 opacity-90">
                                    "{cit.text}"
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    <div className="text-[10px] text-[#868685] text-right mt-1.5 font-medium opacity-80">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex gap-4 max-w-[80%] items-start">
                  <div className="w-8 h-8 rounded-full bg-[#9fe870] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#0e0f0c]">
                    AI
                  </div>
                  <div className="bg-[#f9fbf8] border border-[#0e0f0c]/5 rounded-[24px] rounded-tl-none p-4 flex items-center space-x-2 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-[#0e0f0c] rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-[#0e0f0c] rounded-full animate-bounce delay-200" />
                    <span className="w-1.5 h-1.5 bg-[#0e0f0c] rounded-full animate-bounce delay-300" />
                    <span className="text-xs font-semibold text-[#868685] pl-1 font-sans">
                      Consulting knowledge blocks...
                    </span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3.5 bg-[#320707] text-[#ffd11a] rounded-[24px] text-xs font-bold flex items-start space-x-2 border border-[#ffd11a]/20">
                  <Info className="w-4 h-4 mt-0.5 text-[#ffd11a]" />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chat bottom input action container */}
        <form onSubmit={submitMessage} className="mt-auto">
          <div
            id="footer-actions"
            className="flex items-center gap-3 bg-[#e8ebe6] rounded-full p-2 pl-6 border border-[#0e0f0c]/10 focus-within:ring-2 focus-within:ring-[#9fe870]"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                documents.length === 0
                  ? "🔒 Upload files in the sidebar list to start"
                  : "Ask about your documents..."
              }
              disabled={documents.length === 0 || isSending}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[#0e0f0c] placeholder-[#868685] disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={
                documents.length === 0 || !userInput.trim() || isSending
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                documents.length > 0 && userInput.trim() && !isSending
                  ? "bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad]"
                  : "bg-[#e8ebe6]/80 text-[#868685] cursor-not-allowed"
              }`}
              title="Submit Query"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0e0f0c"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#868685] text-center mt-2.5 font-semibold">
            This indexing channel is fully client-contained within memory for
            maximum security.
          </p>
        </form>
      </div>
    </section>
  );
}
