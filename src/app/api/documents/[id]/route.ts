import { NextResponse } from "next/server";
import { memoryStore } from "../../../../lib/memoryStore";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docIdx = memoryStore.documents.findIndex((d) => d.id === id);
  if (docIdx !== -1) {
    memoryStore.documents.splice(docIdx, 1);
    // Remove matching chunks
    let i = memoryStore.documentChunks.length;
    while (i--) {
      if (memoryStore.documentChunks[i].docId === id) {
        memoryStore.documentChunks.splice(i, 1);
      }
    }
    return NextResponse.json({ success: true, message: "Document removed successfully" });
  }

  return NextResponse.json(
    { success: false, error: "Document not found" },
    { status: 404 }
  );
}
