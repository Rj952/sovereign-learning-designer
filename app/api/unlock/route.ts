import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sld-unlock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;

  // If access code isn't configured, the gate isn't active —
  // someone hitting /unlock manually shouldn't crash anything.
  if (!accessCode) {
    return NextResponse.json(
      { ok: true, note: "Access gate is not enabled on this deployment." },
      { status: 200 }
    );
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const submitted = (body.code || "").trim();
  if (!submitted) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  if (submitted !== accessCode) {
    return NextResponse.json({ error: "That code didn't work." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, accessCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
