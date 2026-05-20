import "./globals.css";
import React from "react";

export const metadata = {
  title: "Document RAG Chat",
  description: "A modern, elegant RAG (Retrieval-Augmented Generation) document search and chat system in the style of Wise.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#e8ebe6] text-[#0e0f0c] antialiased">
        {children}
      </body>
    </html>
  );
}
