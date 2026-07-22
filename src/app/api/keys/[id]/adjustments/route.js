import { NextResponse } from "next/server";
import { applyAdjustment, parseUsdMicros } from "@/lib/db/index.js";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (Object.keys(body).some((key) => !["amountUsd", "description"].includes(key))) throw new Error("Unsupported fields");
    if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 1000)) throw new Error("Invalid description");
    const ledger = await applyAdjustment(id, parseUsdMicros(body.amountUsd, { signed: true }), { description: body.description || null });
    return NextResponse.json({ ledger }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.message === "API key not found" ? 404 : 400 });
  }
}
