import { NextResponse } from "next/server";
import { getApiKeyById, rotateApiKey } from "@/lib/localDb";

// POST /api/keys/[id]/rotate - Regenerate the key value (old value stops working immediately)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getApiKeyById(id);
    if (!existing) return NextResponse.json({ error: "Key not found" }, { status: 404 });
    if (!existing.isActive) return NextResponse.json({ error: "Key is disabled; enable it before rotating" }, { status: 400 });
    const rotated = await rotateApiKey(id);
    if (!rotated) return NextResponse.json({ error: "Key not found" }, { status: 404 });
    return NextResponse.json({ key: rotated.key });
  } catch (error) {
    console.log("Error rotating key:", error);
    return NextResponse.json({ error: "Failed to rotate key" }, { status: 500 });
  }
}
