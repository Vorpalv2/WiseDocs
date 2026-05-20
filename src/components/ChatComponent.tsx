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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ChatMessage, DocumentMeta } from "../types";

interface ChatComponentProps {
  documents: DocumentMeta[];
}

export default function ChatComponent({ documents }: ChatComponentProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedDocIdFilter, setSelectedDocIdFilter] = useState<string>("all");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Autoscroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Sync state if selected document was deleted
  useEffect(() => {
    if (selectedDocIdFilter !== "all" && !documents.some((d) => d.id === selectedDocIdFilter)) {
      setSelectedDocIdFilter("all");
    }
  }, [documents, selectedDocIdFilter]);

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
    if (confirm("Are you sure you want to clear your current database pipeline?")) {
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "RAG engine fails response synthesis.");
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: "assistant",
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      className="bg-white rounded-[24px] border border-[#0e0f0c]/5 shadow-lg overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-h-[600px]"
    >
      {/* Workspace Left Column: Active knowledge sources & selectors */}
      <div className="lg:col-span-4 bg-[#e8ebe6]/40 border-r border-[#0e0f0c]/5 p-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0e0f0c]" />
            <h3 className="font-extrabold text-lg text-[#0e0f0c] tracking-tight">Documents</h3>
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

        <p className="text-xs text-[#868685] font-semibold tracking-wide uppercase">
          Uploaded files in index ({documents.length})
        </p>

        {/* Document list card structure */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] lg:max-h-none pr-1">
          {documents.length === 0 ? (
            <div className="h-48 border border-[#0e0f0c]/10 rounded-[24px] flex flex-col items-center justify-center p-4 text-center bg-[#f9fbf8]/50">
              <div className="w-10 h-10 rounded-full bg-[#0e0f0c]/5 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-[#868685]" />
              </div>
              <p className="text-xs font-bold text-[#0e0f0c]">No documents uploaded</p>
              <p className="text-[11px] text-[#868685] mt-1 max-w-[180px]">
                Drag your PDF, Word, or text files directly inside the converter card above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All Filter */}
              <button
                onClick={() => setSelectedDocIdFilter("all")}
                className={`w-full text-left p-3.5 rounded-full transition-all border flex items-center justify-between cursor-pointer ${
                  selectedDocIdFilter === "all"
                    ? "bg-white border-[#0e0f0c] font-bold text-[#0e0f0c] shadow-xs"
                    : "border-transparent bg-[#e8ebe6]/30 font-medium text-[#454745] hover:bg-[#cbd0c9]/40"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2ead4b]" />
                  <span className="text-xs font-semibold tracking-wide">All Activated Sources</span>
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
                    className={`p-3.5 rounded-full bg-[#e8ebe6]/50 border flex flex-row items-center justify-between space-y-0 relative group hover:shadow-xs transition-all cursor-pointer ${
                      selectedDocIdFilter === doc.id ? "bg-white border-[#0e0f0c]" : "border-[#0e0f0c]/5"
                    }`}
                    onClick={() => setSelectedDocIdFilter(doc.id)}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-8">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#0e0f0c]/5">
                        <span
                          className={`text-[10px] font-black ${
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
                        <p className="text-[10px] text-[#868685]">
                          {(doc.size / 1024).toFixed(1)} KB · {doc.chunksCount} chunks
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDoc(doc.id);
                      }}
                      className="text-[#868685] hover:text-[#d03238] transition-colors p-1.5 rounded-full hover:bg-white cursor-pointer absolute right-2"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#0e0f0c]/5 text-xs text-[#454745] space-y-2">
          <div className="flex items-center space-x-1.5 text-[#0e0f0c] font-bold">
            <Info className="w-4 h-4 text-[#2ead4b]" />
            <span>How RAG Retrieval works</span>
          </div>
          <p className="leading-relaxed text-[#868685]">
            When you submit a query, the Wise server processes the question and prioritizes search overlap matches across your index. Selected reference chunks are compiled into safe, contextual parameters which are passed securely to Gemini for answer formulation.
          </p>
        </div>
      </div>

      {/* Workspace Right Column: Real-time editorial chat interface */}
      <div className="lg:col-span-8 p-6 flex flex-col h-[550px] lg:h-[650px] bg-white relative justify-between">
        {/* Header segment of the active chat */}
        <header className="border-b border-[#0e0f0c]/5 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e2f6d5] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ead4b" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-lg text-[#0e0f0c] leading-none mb-1">
                {messages.length > 0 ? "Analyzing Documents" : "Ready to Interrogate"}
              </h3>
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
              <div className="w-14 h-14 rounded-full bg-[#e8ebe6] flex items-center justify-center text-[#2ead4b]">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight text-[#0e0f0c]">
                  Operational workspace is primed
                </h4>
                <p className="text-xs text-[#868685] mt-1 max-w-sm font-medium">
                  {documents.length > 0
                    ? "Enter your question or reference below to search, extract, and consult your document context directly."
                    : "Upload a TXT, PDF, or Word file first to enable the contextual retrieval conversation frame."}
                </p>
              </div>

              {documents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserInput("Can you summarize the main findings in these documents?")}
                    className="text-[11px] bg-[#e8ebe6] hover:bg-[#cbd0c9] text-[#0e0f0c] px-3.5 py-1.5 rounded-full font-bold transition-all border border-[#0e0f0c]/5 cursor-pointer"
                  >
                    "Can you summarize findings?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserInput("What are the key statistics or figures mentioned?")}
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
                    msg.sender === "user" ? "self-end flex-row-reverse ml-auto" : "items-start"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.sender === "user" ? "bg-black text-white" : "bg-[#9fe870] text-[#0e0f0c]"
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
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                    {msg.sender === "assistant" && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#0e0f0c]/5 space-y-1.5">
                        <span className="text-[10px] font-bold text-[#868685] uppercase tracking-wider block">
                          Active Reference Citations ({msg.citations.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(msg.citations.map((c) => c.docName))).map((docName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1 bg-[#e2f6d5] text-[#054d28] px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#2bad4b]/10"
                            >
                              <FileCheck className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[150px]">{docName}</span>
                            </span>
                          ))}
                        </div>

                        <details className="group mt-2">
                          <summary className="text-[10px] font-bold text-[#2ead4b] cursor-pointer hover:underline flex items-center space-x-1 outline-none">
                            <span>Inspect exact text mappings</span>
                            <ChevronDown className="w-3 h-3 transform group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="mt-2 bg-white border border-[#0e0f0c]/5 rounded-[16px] p-3 space-y-2 max-h-[150px] overflow-y-auto">
                            {msg.citations.map((cit, cIdx) => (
                              <div key={cIdx} className="text-[11px] text-[#454745] border-l-2 border-[#2ead4b] pl-2.5">
                                <span className="font-bold block text-[#0e0f0c]">{cit.docName}:</span>
                                <span className="italic block mt-0.5 opacity-90">"{cit.text}"</span>
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
                  ? "🔒 Upload files first to enable conversation"
                  : "Ask about your documents..."
              }
              disabled={documents.length === 0 || isSending}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-[#0e0f0c] placeholder-[#868685] disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={documents.length === 0 || !userInput.trim() || isSending}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                documents.length > 0 && userInput.trim() && !isSending
                  ? "bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad]"
                  : "bg-[#e8ebe6]/80 text-[#868685] cursor-not-allowed"
              }`}
              title="Submit Query"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e0f0c" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#868685] text-center mt-2.5 font-semibold">
            This indexing channel is fully client-contained within memory for maximum security.
          </p>
        </form>
      </div>
    </section>
  );
}
