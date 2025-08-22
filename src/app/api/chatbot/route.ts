// app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Load Gemini API key from .env
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Optional: disable “thinking” to make it faster
        },
        systemInstruction: "You are a chatbot for academix cloud a school management system erp that solve doubts also for students",

      },
    });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
