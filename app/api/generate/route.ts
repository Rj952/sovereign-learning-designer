import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server route — keeps ANTHROPIC_API_KEY off the client.
 * Set ANTHROPIC_API_KEY in Vercel: Project Settings → Environment Variables.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const HARD_TOKEN_CAP = Number(process.env.ANTHROPIC_MAX_TOKENS || 2000);

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project's environment variables and redeploy.",
      },
      { status: 500 }
    );
  }

  let body: { system?: string; user?: string; maxTokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { system, user, maxTokens } = body;

  if (!system || !user) {
    return NextResponse.json(
      { error: "Missing 'system' or 'user' field." },
      { status: 400 }
    );
  }

  const safeMax = Math.min(
    Math.max(Number(maxTokens) || 1400, 200),
    HARD_TOKEN_CAP
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: safeMax,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = msg.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ text, model: MODEL });
  } catch (err: any) {
    const message = err?.message ?? "Generation failed.";
    const status = err?.status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    note: "POST { system, user, maxTokens? } to this route.",
    model: MODEL,
  });
}
