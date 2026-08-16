import { beforeEach, describe, expect, it, vi } from "vitest";

const getApiKeyById = vi.fn();
const rotateApiKey = vi.fn();
vi.mock("@/lib/localDb", () => ({ getApiKeyById, rotateApiKey }));

const { POST: reveal } = await import("@/app/api/keys/[id]/reveal/route.js");
const { POST: rotate } = await import("@/app/api/keys/[id]/rotate/route.js");

const params = (id) => ({ params: Promise.resolve({ id }) });
const active = { id: "key-1", key: "sk-machine-123-abc123-0123abcd", machineId: "machine-123", name: "Prod", isActive: true };
const disabled = { ...active, id: "key-2", isActive: false };

describe("POST /api/keys/[id]/reveal", () => {
  beforeEach(() => { getApiKeyById.mockReset(); });

  it("returns the raw key once for an active key", async () => {
    getApiKeyById.mockResolvedValue(active);
    const res = await reveal(new Request("http://x/reveal", { method: "POST" }), params("key-1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.key).toBe("sk-machine-123-abc123-0123abcd");
  });

  it("rejects a disabled key with 400", async () => {
    getApiKeyById.mockResolvedValue(disabled);
    const res = await reveal(new Request("http://x/reveal", { method: "POST" }), params("key-2"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the key does not exist", async () => {
    getApiKeyById.mockResolvedValue(null);
    const res = await reveal(new Request("http://x/reveal", { method: "POST" }), params("missing"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/keys/[id]/rotate", () => {
  beforeEach(() => { getApiKeyById.mockReset(); rotateApiKey.mockReset(); });

  it("returns the new raw key and rotates only active keys", async () => {
    getApiKeyById.mockResolvedValue(active);
    rotateApiKey.mockResolvedValue({ ...active, key: "sk-machine-123-xyz789-89abcdef" });
    const res = await rotate(new Request("http://x/rotate", { method: "POST" }), params("key-1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.key).toBe("sk-machine-123-xyz789-89abcdef");
    expect(rotateApiKey).toHaveBeenCalledWith("key-1");
  });

  it("rejects a disabled key with 400 and never rotates", async () => {
    getApiKeyById.mockResolvedValue(disabled);
    const res = await rotate(new Request("http://x/rotate", { method: "POST" }), params("key-2"));
    expect(res.status).toBe(400);
    expect(rotateApiKey).not.toHaveBeenCalled();
  });

  it("returns 404 when the key does not exist", async () => {
    getApiKeyById.mockResolvedValue(null);
    const res = await rotate(new Request("http://x/rotate", { method: "POST" }), params("missing"));
    expect(res.status).toBe(404);
    expect(rotateApiKey).not.toHaveBeenCalled();
  });
});
