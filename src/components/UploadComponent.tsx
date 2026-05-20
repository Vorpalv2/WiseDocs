"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  RefreshCw,
  ArrowRight,
  FileCheck,
  Info,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { DocumentMeta } from "../types";

interface UploadComponentProps {
  documents: DocumentMeta[];
}

export default function UploadComponent({ documents }: UploadComponentProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [calcSourceType, setCalcSourceType] = useState<"PDF" | "TXT" | "DOCX">("PDF");

  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Refresh the Page server component to render latest memory data
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  const totalRawCharacters = documents.reduce((acc, doc) => acc + doc.contentLength, 0);
  const totalProcessedChunks = documents.reduce((acc, doc) => acc + doc.chunksCount, 0);

  return (
    <div className="bg-white rounded-[24px] p-6 border-2 border-[#0e0f0c] shadow-lg flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-[#0e0f0c]/10 pb-4">
        <h3 className="font-black text-sm tracking-tight text-[#0e0f0c] uppercase">Document Pipeline converter</h3>
        <div className="flex space-x-1">
          {(["PDF", "DOCX", "TXT"] as const).map((ext) => (
            <button
              key={ext}
              onClick={() => {
                setCalcSourceType(ext);
                fileInputRef.current?.click();
              }}
              className={`text-xs px-2.5 py-1.5 font-bold rounded-full transition-all cursor-pointer ${
                calcSourceType === ext
                  ? "bg-[#0e0f0c] text-[#9fe870]"
                  : "bg-[#e8ebe6] text-[#454745] hover:bg-[#cbd0c9]"
              }`}
            >
              {ext}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group border-2 border-dashed rounded-[24px] p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? "border-[#2ead4b] bg-[#e2f6d5]"
            : "border-[#0e0f0c]/10 bg-[#f9fbf8] hover:border-[#0e0f0c] hover:bg-[#e8ebe6]/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx"
          className="hidden"
        />

        {isUploading ? (
          <div className="py-4 flex flex-col items-center space-y-2">
            <RefreshCw className="w-8 h-8 text-[#0e0f0c] animate-spin" />
            <p className="text-sm font-semibold text-[#0e0f0c]">Parsing document content...</p>
            <p className="text-xs text-[#868685]">Building custom text chunks</p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e8ebe6] group-hover:bg-[#9fe870]/30 transition-colors flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-[#0e0f0c]" />
            </div>
            <div>
              <p className="text-[#0e0f0c] font-bold text-sm">
                Drag & Drop or <span className="text-[#2ead4b] underline">browse files</span>
              </p>
              <p className="text-xs text-[#868685] mt-1 font-medium">
                Supported: PDF, TXT, DOCX up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Conversion indicator arrow */}
      <div className="flex justify-center -my-2 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#0e0f0c] text-white flex items-center justify-center shadow-md">
          <ArrowRight className="w-5 h-5 transform rotate-90 lg:rotate-0" />
        </div>
      </div>

      {/* Live calculated workspace metrics */}
      <div className="bg-[#e8ebe6] rounded-[24px] p-4 flex flex-col space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold text-[#868685] uppercase tracking-wider">
          <span>To Chat Context Engine</span>
          <span className="flex items-center space-x-1 text-[#2ead4b]">
            <FileCheck className="w-3 h-3" />
            <span>Calculated Live</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-xl border border-[#0e0f0c]/5 text-center">
            <div className="text-lg font-black text-[#0e0f0c]">{documents.length}</div>
            <div className="text-[10px] text-[#868685] font-semibold uppercase">FILES</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#0e0f0c]/5 text-center">
            <div className="text-lg font-black text-[#0e0f0c]">{totalProcessedChunks}</div>
            <div className="text-[10px] text-[#868685] font-semibold uppercase">CHUNKS</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#0e0f0c]/5 text-center">
            <div className="text-lg font-black text-[#0e0f0c]">
              {totalRawCharacters > 1000
                ? `${(totalRawCharacters / 1000).toFixed(1)}k`
                : totalRawCharacters}
            </div>
            <div className="text-[10px] text-[#868685] font-semibold uppercase">CHARACTERS</div>
          </div>
        </div>
      </div>

      {/* Error displays */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-[#320707] text-[#ffd11a] rounded-xl text-xs font-medium flex items-start space-x-2 border border-[#ffd11a]/20"
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#ffd11a]" />
            <span>{uploadError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          if (documents.length === 0) {
            fileInputRef.current?.click();
          } else {
            const el = document.getElementById("workspace-section");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }
        }}
        className="w-full h-12 bg-[#9fe870] hover:bg-[#cdffad] active:bg-[#c5edab] text-[#0e0f0c] font-semibold rounded-full tracking-tight transition-all flex items-center justify-center space-x-2 text-sm shadow-sm cursor-pointer"
      >
        <span>{documents.length === 0 ? "Upload File to Start" : "Unlock Workspace Chat"}</span>
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
}
