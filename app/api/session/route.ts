import { NextRequest, NextResponse } from "next/server";

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("session");
  return res;
}
