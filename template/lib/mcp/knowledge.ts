import OpenAI from "openai";
import { createServerSupabase } from "@/lib/supabase";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

async function embed(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export async function searchKnowledge(query: string): Promise<string> {
  try {
    const embedding = await embed(query);
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: JSON.stringify(embedding),
      match_count: 3,
      match_threshold: 0.5,
    });

    if (error || !data || data.length === 0) {
      return JSON.stringify({ results: [], message: "No matching documents found." });
    }

    return JSON.stringify({
      results: data.map((d: { title: string; content: string; similarity: number }) => ({
        title: d.title,
        content: d.content,
        relevance: Math.round(d.similarity * 100) + "%",
      })),
    });
  } catch {
    return JSON.stringify({ results: [], message: "Knowledge base not configured yet." });
  }
}

export async function addDocument(
  title: string,
  content: string,
  category?: string
): Promise<string> {
  try {
    const embedding = await embed(`${title}\n${content}`);
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("documents").insert({
      title,
      content,
      category: category || "general",
      embedding: JSON.stringify(embedding),
    });

    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ success: true, title });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "Failed to add document" });
  }
}

export async function deleteDocument(documentId: string): Promise<string> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

export async function listDocuments(): Promise<string> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, category, created_at")
    .order("created_at", { ascending: false });

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ documents: data || [] });
}
