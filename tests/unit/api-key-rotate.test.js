import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
let dir; beforeEach(()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),"rotate-"));process.env.DATA_DIR=dir;delete global._dbAdapter;vi.resetModules();}); afterEach(()=>{try{global._dbAdapter?.instance?.close?.();}catch{} delete global._dbAdapter;fs.rmSync(dir,{recursive:true,force:true});});
describe("rotateApiKey",()=>{
  it("changes the key value but keeps id/name/balance/allowlist/ledger and invalidates the old key",async()=>{
    const db=await import("@/lib/db/index.js");
    const created=await db.createApiKey("prod","machine-123",{allowedModels:["openai/gpt"],allowedCombos:["combo-a"]});
    await db.applyTopup(created.id,2_000_000,{description:"fund"});
    const rotated=await db.rotateApiKey(created.id);
    expect(rotated.key).not.toBe(created.key);
    expect(rotated.key).toMatch(/^sk-machine-123-[a-z0-9]{6}-[a-f0-9]{8}$/);
    const stored=await db.getApiKeyById(created.id);
    expect(stored.key).toBe(rotated.key);
    expect(stored.id).toBe(created.id);
    expect(stored.name).toBe("prod");
    expect(stored.creditBalance).toBe(2_000_000);
    expect(stored.allowedModels).toEqual(["openai/gpt"]);
    expect(stored.allowedCombos).toEqual(["combo-a"]);
    expect(await db.getApiKeyLedger(created.id)).toHaveLength(1);
    expect(await db.getApiKeyByValue(created.key)).toBeNull();
    expect(await db.validateApiKey(created.key)).toBe(false);
    expect(await db.validateApiKey(rotated.key)).toBe(true);
  });
  it("returns null for a missing key",async()=>{
    const db=await import("@/lib/db/index.js");
    expect(await db.rotateApiKey("nope")).toBeNull();
  });
});
