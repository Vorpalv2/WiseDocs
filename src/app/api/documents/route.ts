import { NextResponse } from "next/server";
import { memoryStore } from "../../../lib/memoryStore";

export async function GET() {
  return NextResponse.json({
    documents: memoryStore.documents,
  });
}

export async function DELETE() {
  memoryStore.documents.length = 0;
  memoryStore.documentChunks.length = 0;
  return NextResponse.json({
    success: true,
    message: "All documents cleared successfully",
  });
}
