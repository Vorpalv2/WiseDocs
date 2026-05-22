import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// 👈 Swapped for the clean, serverless-friendly fork
// @ts-ignore - Keeps TS compiler happy if the fork omits top-level declaration files
import pdfParse from "pdf-parse-fork";
import {
  createEmbeddings,
  UploadFileIntoSupabaseStorage,
} from "@/src/lib/supabaseclient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    // 1. Extract multi-part body properties safely (bypasses JSON parse error)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No document file detected in upload body payload.",
        },
        { status: 400 },
      );
    }

    const filename = file.name;
    const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();

    let textContent = "";
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    console.log(`📂 Processing file natively via fork: ${filename}`);

    // 2. Multi-format text routing
    if (extension === ".pdf") {
      // The fork uses the same interface: accepts a buffer, returns an object with a .text property
      const parsedPdf = await pdfParse(fileBuffer);
      textContent = parsedPdf.text;
      await UploadFileIntoSupabaseStorage(file);
    } else if (extension === ".txt") {
      textContent = fileBuffer.toString("utf-8");
    } else if (extension === ".docx") {
      return NextResponse.json(
        {
          success: false,
          error: "DOCX parser parsing setup is pending on the server.",
        },
        { status: 400 },
      );
    }

    if (!textContent || !textContent.trim()) {
      throw new Error(
        "Unable to extract structured textual context from the document.",
      );
    }

    // 3. Register or locate the parent file tracking index row
    console.log(
      "💾 Provisioning file record inside Supabase tracking tables...",
    );
    const { data: docRecord, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({ filename: filename, status: "processing" })
      .select("id")
      .single();

    if (docError) throw docError;
    const targetDocId = docRecord.id;

    // 4. Group concepts using LangChain
    console.log(
      "🦜 Organizing content into LangChain recursive semantic blocks...",
    );
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(textContent);
    console.log(`📄 Splitting phase generated ${chunks.length} clean chunks.`);

    // 5. Batch vector conversion via Gemini
    console.log("🤖 Running vector matrix extraction via Vercel AI SDK...");
    const embeddings = await createEmbeddings(chunks);

    // 6. Map structured vectors to database schema rows
    const rows = chunks.map((chunkText, index) => ({
      document_id: targetDocId,
      content: chunkText,
      embedding: embeddings[index],
      metadata: { filename, chunk_index: index },
    }));

    console.log(`💾 Committing ${rows.length} records to document_sections...`);
    const { error: dbError } = await supabaseAdmin
      .from("document_sections")
      .insert(rows);

    if (dbError) throw dbError;

    // Transition tracking status to complete
    await supabaseAdmin
      .from("documents")
      .update({ status: "completed" })
      .eq("id", targetDocId);

    console.log("🎉 Parsing data flow completed cleanly.");
    return NextResponse.json({
      success: true,
      successMessage: `${filename} processed into ${chunks.length} vectors successfully.`,
    });
  } catch (error: any) {
    console.error("❌ Execution Crash Blocked:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
