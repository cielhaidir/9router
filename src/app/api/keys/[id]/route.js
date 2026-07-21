import { NextResponse } from "next/server";
import { deleteApiKey, getApiKeyById, updateApiKey } from "@/lib/localDb";

// GET /api/keys/[id] - Get single key
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const key = await getApiKeyById(id);
    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    return NextResponse.json({ key });
  } catch (error) {
    console.log("Error fetching key:", error);
    return NextResponse.json({ error: "Failed to fetch key" }, { status: 500 });
  }
}

// PUT /api/keys/[id] - Update key
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive, name, allowedModels, allowedCombos, notes } = body;
    const allowedFields = new Set(["isActive", "name", "allowedModels", "allowedCombos", "notes"]);
    if (Object.keys(body).some((key) => !allowedFields.has(key))) return NextResponse.json({ error: "Unsupported key fields" }, { status: 400 });
    for (const list of [allowedModels, allowedCombos]) if (list !== undefined && (!Array.isArray(list) || list.some((v) => typeof v !== "string" || !v.trim()) || new Set(list).size !== list.length)) return NextResponse.json({ error: "Allowlists must contain unique non-empty strings" }, { status: 400 });

    const existing = await getApiKeyById(id);
    if (!existing) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (allowedModels !== undefined) updateData.allowedModels = allowedModels;
    if (allowedCombos !== undefined) updateData.allowedCombos = allowedCombos;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await updateApiKey(id, updateData);

    return NextResponse.json({ key: updated });
  } catch (error) {
    console.log("Error updating key:", error);
    return NextResponse.json({ error: "Failed to update key" }, { status: 500 });
  }
}

// DELETE /api/keys/[id] - Delete API key
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const deleted = await deleteApiKey(id);
    if (!deleted) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Key deleted successfully" });
  } catch (error) {
    console.log("Error deleting key:", error);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
