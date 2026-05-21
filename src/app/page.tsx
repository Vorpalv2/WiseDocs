import React, { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { memoryStore } from "../lib/memoryStore";
import Navbar from "../components/Navbar";
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
      <Suspense fallback={
        <nav className="sticky top-0 z-50 h-20 bg-white border-b border-[#0e0f0c]/5 px-8 flex items-center justify-between shadow-xs">
          <span className="text-xl font-black">WiseDocs RAG Utility</span>
        </nav>
      }>
        <Navbar 
          documentsCount={documents.length}
          combinedFileSizeKB={combinedFileSizeKB}
          totalProcessedChunks={totalProcessedChunks}
        />
      </Suspense>

      {/* Main Container Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col space-y-10">
        {/* HERO BRAND BAND */}
        <section className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white rounded-full border border-[#0e0f0c]/10 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#2ead4b]" />
            <span className="text-xs font-semibold text-[#454745]">
              Direct pipeline indexing. Complete privacy.
            </span>
          </div>
          {/* Massive Wise Sans approximation (heavy 900 display typography) */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0e0f0c] leading-[1.05]">
            Upload local files. <br />
            <span className="text-[#2ead4b]">Interrogate instantly.</span>
          </h1>

        </section>

        {/* WORKSPACE & RETRIEVAL INTERACTION */}
        <Suspense fallback={
          <div className="bg-white rounded-[24px] border border-[#0e0f0c]/5 shadow-lg p-12 text-center text-sm font-semibold text-gray-500">
            Initializing RAG environment workspace...
          </div>
        }>
          <ChatComponent documents={documents} />
        </Suspense>
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
