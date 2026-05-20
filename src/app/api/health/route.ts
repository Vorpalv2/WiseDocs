import { NextResponse } from "next/server";
import { memoryStore } from "../../../lib/memoryStore";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    activeDocuments: memoryStore.documents.length,
  });
}
