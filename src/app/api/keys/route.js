import { NextResponse } from "next/server";
import { getApiKeys, createApiKey } from "@/lib/localDb";
import { getConsistentMachineId } from "@/shared/utils/machineId";

export const dynamic = "force-dynamic";

// GET /api/keys - List API keys
export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json({ keys });
  } catch (error) {
    console.log("Error fetching keys:", error);
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

// POST /api/keys - Create new API key
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, allowedModels, allowedCombos, notes } = body;
    const allowedFields = new Set(["name", "allowedModels", "allowedCombos", "notes"]);
    if (Object.keys(body).some((key) => !allowedFields.has(key))) return NextResponse.json({ error: "Unsupported key fields" }, { status: 400 });
    for (const list of [allowedModels, allowedCombos]) if (list !== undefined && (!Array.isArray(list) || list.some((value) => typeof value !== "string" || !value.trim()) || new Set(list).size !== list.length)) return NextResponse.json({ error: "Allowlists must contain unique non-empty strings" }, { status: 400 });
    if (notes !== undefined && (typeof notes !== "string" || notes.length > 1000)) return NextResponse.json({ error: "Invalid notes" }, { status: 400 });

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Always get machineId from server
    const machineId = await getConsistentMachineId();
    const apiKey = await createApiKey(name.trim(), machineId, { allowedModels, allowedCombos, notes });

    return NextResponse.json({
      key: apiKey.key,
      name: apiKey.name,
      id: apiKey.id,
      machineId: apiKey.machineId,
    }, { status: 201 });
  } catch (error) {
    console.log("Error creating key:", error);
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}
