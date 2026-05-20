import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { memoryStore } from "../lib/memoryStore";
import UploadComponent from "../components/UploadComponent";
import ChatComponent from "../components/ChatComponent";

export const dynamic = "force-dynamic";

export default function Page() {
  // Fetch active documents directly from our server-side memory store
  const documents = memoryStore.documents;

  // Calculate live server-side statistics
  const totalProcessedChunks = documents.reduce((acc, doc) => acc + doc.chunksCount, 0);
  const combinedFileSizeKB = (documents.reduce((acc, doc) => acc + doc.size, 0) / 1024).toFixed(1);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#e8ebe6] text-[#0e0f0c]">
      {/* Sticky top Nav in Wise Modern Style */}
      <nav
        id="nav-bar"
        className="sticky top-0 z-50 h-20 bg-white border-b border-[#0e0f0c]/5 px-8 flex items-center justify-between shadow-xs"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#9fe870] rounded-full flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0e0f0c"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight font-sans text-[#0e0f0c]">
            WiseDocs{" "}
            <span className="font-semibold text-xs text-[#868685] bg-[#e8ebe6]/60 px-2.5 py-1 rounded-full uppercase ml-1">
              RAG Utility
            </span>
          </span>
        </div>

        {/* Global stats bar inside header for professional layout */}
        {documents.length > 0 && (
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex flex-col text-right">
              <span className="text-xs text-[#868685] font-semibold uppercase tracking-wider">
                Active Workspace
              </span>
              <span className="font-bold text-[#0e0f0c]">
                {documents.length} Source File{documents.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-8 w-px bg-[#0e0f0c]/10" />
            <div className="flex flex-col text-right">
              <span className="text-xs text-[#868685] font-semibold uppercase tracking-wider">
                Index Size
              </span>
              <span className="font-bold text-[#0e0f0c]">
                {combinedFileSizeKB} KB ({totalProcessedChunks} Chunks)
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#e2f6d5] text-[#054d28] font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#2ead4b] animate-pulse" />
            <span>Gemini Hub Live</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#000000] text-[#9fe870] flex items-center justify-center font-bold text-sm tracking-widest cursor-pointer hover:bg-[#0e0f0c] transition-all">
            AA
          </div>
        </div>
      </nav>

      {/* Main Container Section split */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col space-y-12">
        {/* HERO BRAND BAND AND SIGNATURE CONVERTER CARD */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Beautiful Swiss/Fintech display moment */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white rounded-full border border-[#0e0f0c]/10 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#2ead4b]" />
              <span className="text-xs font-semibold text-[#454745]">
                Zero borders. Precise extraction.
              </span>
            </div>
            {/* Massive Wise Sans approximation (heavy 900 display typography) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0e0f0c] leading-[1.05]">
              Upload local files. <br />
              <span className="text-[#2ead4b]">Interrogate instantly.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#454745] font-medium max-w-xl leading-relaxed">
              No index setups or vectors to configure. Our proprietary RAG channel parses DOCX, TXT,
              and PDF documents into logical semantic chunks on our secure server. Powered under the
              hood by <strong className="font-bold text-[#0e0f0c]">Gemini 3.5 Flash</strong>.
            </p>

            {/* Grid of brand highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-xl">
              <div className="flex items-start space-x-3 p-5 bg-white rounded-[24px] border border-[#0e0f0c]/5 shadow-sm">
                <div className="text-[#2ead4b] mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0e0f0c] text-sm">Collapsible Citations</h4>
                  <p className="text-xs text-[#868685] mt-1">
                    Trace every statement back to source file segments.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-5 bg-white rounded-[24px] border border-[#0e0f0c]/5 shadow-sm">
                <div className="text-[#2ead4b] mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0e0f0c] text-sm">Format Independence</h4>
                  <p className="text-xs text-[#868685] mt-1">
                    Seamless extraction of TXT logs, corporate PDFs, and Word DOCX.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Modular Client Upload Component */}
          <div className="lg:col-span-5">
            <UploadComponent documents={documents} />
          </div>
        </section>

        {/* WORKSPACE & RETRIEVAL INTERACTION */}
        <ChatComponent documents={documents} />
      </main>

      {/* Corporate Wise style footer */}
      <footer className="bg-[#0e0f0c] text-[#e8ebe6] mt-16 px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#9fe870] flex items-center justify-center text-xs font-black text-[#0e0f0c]">
              W
            </div>
            <span className="font-bold text-md tracking-tight text-white">Wise RAG Channel</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#868685] font-semibold uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Gemini Models
            </a>
            <a href="#" className="hover:text-white transition-colors font-bold text-[#9fe870]">
              Wise Identity
            </a>
          </div>

          <p className="text-xs text-[#868685] text-center md:text-right">
            © 2026 Wise RAG Workspace. Optimized for PDF, DOCX, & TXT index structures.
          </p>
        </div>
      </footer>
    </div>
  );
}
