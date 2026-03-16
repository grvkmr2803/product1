"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function analyzeReflection(bookId: string, reflection: string) {

  const supabase = await createClient();

  const prompt = `
Analyze this reflection and classify the reader archetype.

Archetypes:
Stoic → discipline, control, acceptance
Seeker → curiosity, exploration, philosophy
Builder → systems, productivity, improvement
Lover → emotion, connection, humanity

Reflection:
"${reflection}"

Return JSON only:

{
 "archetype": "",
 "themes": [],
 "insight": ""
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      archetype: "seeker",
      themes: [],
      insight: "Your reflection explores ideas and meaning."
    };
  }

  await supabase
    .from("books")
    .update({
      archetype: parsed.archetype,
      themes: parsed.themes,
      insight: parsed.insight
    })
    .eq("id", bookId);

  return parsed;
}