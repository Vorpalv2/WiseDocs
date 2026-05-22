import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
);

export async function UploadFileIntoSupabaseStorage(file: File) {
  //   const formData = await req.formData();
  //   const file = formData.get("file") as File | null;
  //   if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const filePath = `user-uploads/${file.name}`;
  //   const filePath = "${file.name}";
  const { data, error } = await supabase.storage
    .from("PDF")
    .upload(filePath, file, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (error) {
    // Check if error is specifically a duplicate file error
    if (error.message?.includes("The resource already exists")) {
      throw new Error("A file with this name already exists in storage.");
    }
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  console.log("Upload successful:", data.path);
  return data; // Return the data object containing the path
}

export async function createChunks(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 200,
    chunkSize: 1000,
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}

export async function createEmbeddings(text: string[]) {
  try {
    const model = google.embeddingModel("gemini-embedding-001");
    // const model = openai.embedding("text-embedding-3-small");

    const { embeddings, usage } = await embedMany({
      model,
      values: text,
      providerOptions: {
        google: {
          outputDimensionality: 768,
          taskType: "SEMANTIC_SIMILARITY",
        },
      },
    });
    console.log(usage, "total usage");
    return embeddings;
  } catch (error) {
    throw new Error(error);
  }
}
