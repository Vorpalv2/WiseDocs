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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#e8ebe6] text-[#0e0f0c] dark:bg-[#0e100c] dark:text-[#f0f3ee] antialiased">
        {children}
      </body>
    </html>
  );
}
