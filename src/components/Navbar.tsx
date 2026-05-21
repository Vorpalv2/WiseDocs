"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Cpu, Sun, Moon } from "lucide-react";

interface NavbarProps {
  documentsCount: number;
  combinedFileSizeKB: string;
  totalProcessedChunks: number;
}

export default function Navbar({
  documentsCount,
  combinedFileSizeKB,
  totalProcessedChunks,
}: NavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "gemini";
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.toggle("dark");
      setIsDarkMode(isDark);
      window.localStorage.setItem("theme", isDark ? "dark" : "light");
    }
  };

  const handleSwitchProvider = (newProvider: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("provider", newProvider);
    router.push(`/?${params.toString()}`);
  };

  return (
    <nav
      id="nav-bar"
      className="sticky top-0 z-50 min-h-20 bg-white border-b border-[#0e0f0c]/5 px-6 py-3 lg:px-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-[#9fe870] rounded-full flex items-center justify-center shrink-0">
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
        <span className="text-xl lg:text-2xl font-black tracking-tight font-sans text-[#0e0f0c] shrink-0">
          WiseDocs{" "}
          <span className="font-semibold text-[10px] text-[#868685] bg-[#e8ebe6]/60 px-2 py-0.5 rounded-full uppercase ml-1">
            RAG Utility
          </span>
        </span>
      </div>

      {/* Switcher Option */}
      <div className="flex items-center bg-[#e8ebe6] p-1 rounded-full border border-[#0e0f0c]/5 shadow-inner">
        <button
          onClick={() => handleSwitchProvider("gemini")}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            provider === "gemini"
              ? "bg-[#9fe870] text-[#0e0f0c] shadow-xs"
              : "text-[#868685] hover:text-[#0e0f0c]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span>Gemini Hub</span>
        </button>
        <button
          onClick={() => handleSwitchProvider("ollama")}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            provider === "ollama"
              ? "bg-[#9fe870] text-[#0e0f0c] shadow-xs"
              : "text-[#868685] hover:text-[#0e0f0c]"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 shrink-0 text-[#2ead4b]" />
          <span>Local Ollama</span>
        </button>
      </div>

      {/* Global stats bar inside header for professional layout */}
      <div className="flex items-center space-x-6 text-sm">
        {documentsCount > 0 && (
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-[#868685] font-semibold uppercase tracking-wider">
                Active Workspace
              </span>
              <span className="font-bold text-[#0e0f0c] text-xs">
                {documentsCount} Source File{documentsCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-8 w-px bg-[#0e0f0c]/10" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-[#868685] font-semibold uppercase tracking-wider">
                Index Size
              </span>
              <span className="font-bold text-[#0e0f0c] text-xs">
                {combinedFileSizeKB} KB ({totalProcessedChunks} Chunks)
              </span>
            </div>
            <div className="h-8 w-px bg-[#0e0f0c]/10" />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#e2f6d5] text-[#054d28] font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ead4b] animate-pulse" />
            <span>{provider === "ollama" ? "Ollama Engine Ready" : "Gemini Hub Live"}</span>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-full bg-[#e8ebe6] hover:bg-[#cbd0c9] text-[#0e0f0c] flex items-center justify-center cursor-pointer transition-all border border-[#0e0f0c]/5 shadow-xs"
            title={isDarkMode ? "Switch to Light theme" : "Switch to Dark theme"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-[#868685] hover:text-[#0e0f0c]" />
            )}
          </button>

          <div className="w-9 h-9 rounded-full bg-[#000000] text-[#9fe870] flex items-center justify-center font-bold text-xs tracking-widest cursor-pointer hover:scale-105 transition-transform" title="User Account">
            AA
          </div>
        </div>
      </div>
    </nav>
  );
}
