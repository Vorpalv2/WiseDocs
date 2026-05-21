import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { retrieveRelevantChunks } from "../../../lib/memoryStore";

// Initialize the Google Gen AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(request: Request) {
  try {
    const { 
      message, 
      history = [], 
      docId, 
      provider = "gemini", 
      ollamaModel = "llama3", 
      ollamaHost = "http://localhost:11434" 
    } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    // 1. Retrieve the most relevant chunks from memory RAG index with docId context filter
    const relevantChunks = retrieveRelevantChunks(message, 5, docId);

    // 2. Format Context
    let contextText = "";
    if (relevantChunks.length > 0) {
      contextText = relevantChunks
        .map((chunk, index) => {
          return `=== SOURCE ${index + 1}: [${chunk.docName}] ===\n${chunk.text}\n=== END SOURCE ${index + 1} ===`;
        })
        .join("\n\n");
    } else {
      contextText = "No documents uploaded. Answer general knowledge or ask user to upload documents.";
    }

    // 3. Construct System Prompt & Instructions
    const systemInstruction = `You are an elegant, friendly, high-accuracy AI retrieval-augmented assistant. Your responses should align with the prestigious Wise design philosophy - clear, objective, conversational, and direct.
    
    If relevant documents are provided as context, answer the user's inquiry strictly using the provided source chunks. 
    At the very bottom of your response, output a clean list of sources you cited (formatting as "Cited: <Document Name>").
    
    If the context does not contain the answer, politely state that you could not find the answer in the uploaded files but provide any helpful general context if appropriate, maintaining complete clarity. Keep your formatting in clean Markdown.`;

    // 4. Create prompt history context
    const fullPrompt = `Below is the relevant searched context from the user's uploaded documents.
    
    ---- START CONTEXT ----
    ${contextText}
    ---- END CONTEXT ----

    Conversation History:
    ${history.map((h: any) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")}
    
    Current User Question: "${message}"`;

    const citations = relevantChunks.map((chunk) => ({
      docName: chunk.docName,
      text: chunk.text,
    }));

    // 5. Query Gemini or Local/Remote Ollama depending on active provider
    if (provider === "ollama") {
      const isLoopback = 
        ollamaHost.includes("localhost") || 
        ollamaHost.includes("127.0.0.1") || 
        ollamaHost.includes("::1");

      if (isLoopback) {
        // For security and loopback accessibility, direct browser calls (client-side) bypass CORS constraints
        // so we return the prompt payloads for client-side local LLM resolution
        return NextResponse.json({
          success: true,
          isLocal: true,
          localPrompt: fullPrompt,
          systemInstruction: systemInstruction,
          citations,
        });
      }

      // If remote, compile server-side using standard node-fetch
      try {
        const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `${systemInstruction}\n\n${fullPrompt}`,
            stream: false,
          }),
        });

        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text();
          throw new Error(`Ollama server returned status ${ollamaRes.status}: ${errText}`);
        }

        const ollamaData = await ollamaRes.json();
        const replyText = ollamaData.response || "No response received from Ollama.";

        return NextResponse.json({
          success: true,
          response: replyText,
          citations,
        });
      } catch (ollamaErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Unable to establish endpoint pipeline to Remote Ollama at ${ollamaHost}: ${ollamaErr.message || ollamaErr}`,
          },
          { status: 502 }
        );
      }
    }

    // Default: Gemini API pipeline
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const replyText = response.text || "I was unable to formulate a response.";

    return NextResponse.json({
      success: true,
      response: replyText,
      citations,
    });
  } catch (error: any) {
    console.error("Next.js Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred during the conversation search phase.",
      },
      { status: 500 }
    );
  }
}
