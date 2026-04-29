import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server route — keeps ANTHROPIC_API_KEY off the client.
 * Set ANTHROPIC_API_KEY in Vercel: Project Settings → Environment Variables.
 *
 * Includes an in-memory per-IP rate limiter. Imperfect across cold starts and
 * horizontally scaled instances, but a useful safeguard against single-IP
 * runaway usage. For stricter limits, swap the in-memory store for Vercel KV
 * or Upstash Redis with @upstash/ratelimit.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const HARD_TOKEN_CAP = Number(process.env.ANTHROPIC_MAX_TOKENS || 2000);

// Rate limit defaults: 30 requests per IP per hour. Configurable via env.
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 30);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);

type Bucket = { count: number; resetAt: number };
const buckets: Map<string, Bucket> = (globalThis as any).__sld_buckets__ || new Map();
(globalThis as any).__sld_buckets__ = buckets;

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function rateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    buckets.set(ip, fresh);
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetAt: fresh.resetAt };
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, remaining: RATE_LIMIT_MAX - existing.count, resetAt: existing.resetAt };
}

// Periodically prune expired buckets so the map doesn't grow unbounded.
function pruneExpired() {
  const now = Date.now();
  for (const [ip, b] of buckets.entries()) {
    if (b.resetAt <= now) buckets.delete(ip);
  }
}

export async function POST(req: NextRequest) {
  pruneExpired();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project's environment variables and redeploy.",
      },
      { status: 500 }
    );
  }

  // Rate limit
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  const headers = {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };

  if (!rl.ok) {
    const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
        resetAt: rl.resetAt,
      },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfterSec) } }
    );
  }

  let body: { system?: string; user?: string; maxTokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers });
  }

  const { system, user, maxTokens } = body;

  if (!system || !user) {
    return NextResponse.json(
      { error: "Missing 'system' or 'user' field." },
      { status: 400, headers }
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

    return NextResponse.json({ text, model: MODEL }, { headers });
  } catch (err: any) {
    const message = err?.message ?? "Generation failed.";
    const status = err?.status ?? 500;
    return NextResponse.json({ error: message }, { status, headers });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    note: "POST { system, user, maxTokens? } to this route.",
    model: MODEL,
    rateLimit: { max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS },
  });
}
