import { NextResponse } from "next/server";
import { getApiKeyById } from "@/lib/localDb";

// POST /api/keys/[id]/reveal - One-time raw key reveal (transient; active keys only)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getApiKeyById(id);
    if (!existing) return NextResponse.json({ error: "Key not found" }, { status: 404 });
    if (!existing.isActive) return NextResponse.json({ error: "Key is disabled; enable it before revealing" }, { status: 400 });
    return NextResponse.json({ key: existing.key });
  } catch (error) {
    console.log("Error revealing key:", error);
    return NextResponse.json({ error: "Failed to reveal key" }, { status: 500 });
  }
}
