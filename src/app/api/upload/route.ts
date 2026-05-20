import { NextResponse } from "next/server";
import path from "path";
import mammoth from "mammoth";
import { createRequire } from "module";
import { memoryStore, chunkText } from "../../../lib/memoryStore";

// Setup require for CommonJS compatibility in Next.js Server Side Execution
const requirePkg = createRequire(import.meta.url);
const pdf = requirePkg("pdf-parse");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const filename = file.name;
    const extension = path.extname(filename).toLowerCase();
    let textContent = "";

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse according to type
    if (extension === ".txt") {
      textContent = buffer.toString("utf-8");
    } else if (extension === ".pdf") {
      const parsedPdf = await pdf(buffer);
      textContent = parsedPdf.text;
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: buffer });
      textContent = result.value;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Only PDF, TXT, and DOCX are allowed.",
        },
        { status: 400 }
      );
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This document is empty or text could not be extracted.",
        },
        { status: 400 }
      );
    }

    // Create unique doc structure
    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const parsedChunks = chunkText(textContent, docId, filename);

    const docMeta = {
      id: docId,
      name: filename,
      size: file.size,
      type: extension.replace(".", "").toUpperCase(),
      contentLength: textContent.length,
      chunksCount: parsedChunks.length,
      uploadedAt: new Date().toISOString(),
    };

    // Store in global memory
    memoryStore.documents.push(docMeta);
    memoryStore.documentChunks.push(...parsedChunks);

    return NextResponse.json({
      success: true,
      document: docMeta,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while processing the document.",
      },
      { status: 500 }
    );
  }
}
