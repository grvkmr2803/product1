"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "../../lib/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateAndSaveIdentity(userId: string) {
  const supabase = await createClient(); // ✅ FIX

  // 1. Get user's reflections
  const { data: books, error: fetchError } = await supabase
    .from("books")
    .select("reflection")
    .eq("user_id", userId)
    .not("reflection", "is", null);

  if (fetchError || !books?.length) {
    return { success: false, description: "No reflections yet..." };
  }

  const reflections = books
    .map((b) => b.reflection)
    .filter(Boolean) as string[];

  const recent = reflections.slice(-12);

  const prompt = `
You are a wise, poetic companion who helps people understand who they are becoming through their reading reflections.

Recent reflections:
${recent.map((r) => `• ${r}`).join("\n")}

Write a short (2–4 sentences, max 90 words), deeply personal, mystical description of their current reading identity.
- Second person ("You are...", "Your soul carries...")
- Gentle, philosophical, cosmic tone
- Focus on emotions, themes, inner shifts from the text only
- Warm, affirming
- End with subtle invitation to continue
`;

  try {
    const result = await model.generateContent(prompt);

    const description =
      result.response.text().trim() ||
      "A quiet presence is forming...";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ identity_description: description })
      .eq("id", userId);

    if (updateError) throw updateError;

    return { success: true, description };
  } catch (err) {
    console.error("Identity generation failed:", err);

    return {
      success: false,
      description: "The Aether is quiet today...",
    };
  }
}