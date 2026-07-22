import { NextResponse } from "next/server";
import { getApiKeys } from "@/lib/db/index.js";

function maskKey(value) {
  if (!value) return "••••••••";
  return value.length <= 8 ? "••••••••" : `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

// Managed-key listing deliberately never serializes the credential. The raw value is
// returned only by POST /api/keys at creation time.
export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json({
      keys: keys.map(({ key, machineId, ...apiKey }) => ({ ...apiKey, maskedKey: maskKey(key) })),
    });
  } catch (error) {
    console.error("Error fetching managed API keys:", error);
    return NextResponse.json({ error: "Failed to fetch managed API keys" }, { status: 500 });
  }
}
