import { beforeEach, describe, expect, it, vi } from "vitest";

const getApiKeys = vi.fn();
vi.mock("@/lib/db/index.js", () => ({ getApiKeys }));

const { GET } = await import("@/app/api/billing/keys/route.js");

describe("GET /api/billing/keys", () => {
  beforeEach(() => getApiKeys.mockReset());

  it("returns managed-key fields and a mask, never the raw credential", async () => {
    getApiKeys.mockResolvedValue([{
      id: "key-1", key: "sk-secret-value-1234", machineId: "machine-secret", name: "Production",
      isActive: true, creditBalance: 2_500_000, totalTopup: 3_000_000, totalSpent: 500_000,
      allowedModels: ["openai/gpt"], allowedCombos: [], notes: "service account",
    }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.keys[0]).toMatchObject({ id: "key-1", name: "Production", maskedKey: "sk-s••••1234" });
    expect(body.keys[0]).not.toHaveProperty("key");
    expect(body.keys[0]).not.toHaveProperty("machineId");
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });
});
