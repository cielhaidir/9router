import { describe, expect, it } from "vitest";
import { calculateChargeMicros, normalizeRateToMicrosPerMillion, assertApiKeyCanUse } from "@/lib/db/repos/billingRepo.js";

describe("billing arithmetic", () => {
  const rate = { inputMicrosPerMillion: 2_000_000, cachedMicrosPerMillion: 200_000, outputMicrosPerMillion: 10_000_000, reasoningMicrosPerMillion: 10_000_000 };
  it("bills all token classes and removes cached input from normal input", () => {
    expect(calculateChargeMicros({ prompt_tokens: 1_000_000, cached_tokens: 200_000, completion_tokens: 100_000, reasoning_tokens: 50_000 }, rate)).toBe(3_140_000);
  });
  it("clamps invalid cached values and handles missing rates", () => {
    expect(calculateChargeMicros({ prompt_tokens: 10, cached_tokens: 99 }, {})).toBe(0);
  });
  it("parses exact decimal rates without floats", () => {
    expect(normalizeRateToMicrosPerMillion("2.500001")).toBe(2_500_001);
    expect(() => normalizeRateToMicrosPerMillion("1.0000001")).toThrow();
  });
});

describe("key policy", () => {
  it("applies independent direct and combo allowlists", () => {
    const key = { isActive: true, creditBalance: 1, allowedModels: ["a"], allowedCombos: ["combo"] };
    expect(() => assertApiKeyCanUse({ apiKey: key, requestedModel: "a", isCombo: false })).not.toThrow();
    expect(() => assertApiKeyCanUse({ apiKey: key, requestedModel: "combo", isCombo: true })).not.toThrow();
    expect(() => assertApiKeyCanUse({ apiKey: key, requestedModel: "a", isCombo: true })).toThrow("combo");
  });
});
