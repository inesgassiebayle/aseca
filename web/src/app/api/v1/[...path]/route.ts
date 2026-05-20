import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

async function proxy(request: NextRequest, path: string[]) {
  const qs = request.nextUrl.searchParams.toString();
  const url = `${API_URL}/api/v1/${path.join("/")}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: request.method,
    headers: { "Content-Type": "application/json" },
    body: request.method !== "GET" ? await request.text() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}