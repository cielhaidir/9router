import { describe, expect, it } from "vitest";

import REGISTRY from "../../open-sse/providers/registry/index.js";
import { PROVIDERS, PROVIDER_MODELS } from "../../open-sse/providers/index.js";
import { getExecutor } from "../../open-sse/executors/index.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import { getThinkingLevels } from "../../open-sse/providers/thinkingLevels.js";
import { resolveProviderAlias } from "../../open-sse/services/model.js";

describe("chatgpt-web provider", () => {
  const entry = REGISTRY.find((e) => e.id === "chatgpt-web");

  it("is registered as a separate no-auth OpenAI Responses provider", () => {
    expect(entry).toBeDefined();
    expect(entry.id).toBe("chatgpt-web");
    expect(entry.category).toBe("apikey");
    expect(entry.noAuth).toBe(true);
    expect(PROVIDERS["chatgpt-web"]).toBeDefined();
    expect(PROVIDERS["chatgpt-web"].format).toBe("openai-responses");
  });

  it("defaults to the local codex-chatgpt-web bridge and appends /v1/responses", () => {
    // Transport baseUrl is the host root; the executor builds the Responses endpoint.
    expect(PROVIDERS["chatgpt-web"].baseUrl).toBe("http://127.0.0.1:17841");
    expect(PROVIDERS["chatgpt-web"].validateUrl).toBe("http://127.0.0.1:17841/v1/models");
    const executor = getExecutor("chatgpt-web");
    expect(executor.buildUrl("gpt-5.6-luna", true)).toBe("http://127.0.0.1:17841/v1/responses");
    // Per-connection override via providerSpecificData.baseUrl.
    expect(executor.buildUrl("gpt-5.6-luna", true, 0, { providerSpecificData: { baseUrl: "http://127.0.0.1:18000" } }))
      .toBe("http://127.0.0.1:18000/v1/responses");
    expect(executor.buildUrl("gpt-5.6-luna", true, 0, { providerSpecificData: { baseUrl: "http://127.0.0.1:18000/v1/responses" } }))
      .toBe("http://127.0.0.1:18000/v1/responses");
  });

  it("exposes gpt-5.6-luna and gpt-5.6-sol with ChatGPT Web display names", () => {
    const ids = (PROVIDER_MODELS["cgw"] || []).map((m) => ({ id: m.id, name: m.name }));
    expect(ids).toContainEqual({ id: "gpt-5.6-luna", name: "ChatGPT Web Luna" });
    expect(ids).toContainEqual({ id: "gpt-5.6-sol", name: "ChatGPT Web Sol" });
  });

  it("resolves via the cgw alias without touching codex", () => {
    expect(resolveProviderAlias("cgw")).toBe("chatgpt-web");
    expect(resolveProviderAlias("chatgpt-web")).toBe("chatgpt-web");
    expect(resolveProviderAlias("cx")).toBe("codex"); // codex untouched
  });

  it("supports reasoning efforts low..max and ChatGPT-grade capabilities", () => {
    expect(getThinkingLevels("chatgpt-web", "gpt-5.6-luna")).toEqual(
      ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
    );
    expect(getCapabilitiesForModel("chatgpt-web", "gpt-5.6-sol")).toMatchObject({
      reasoning: true,
      thinkingFormat: "openai",
      vision: true,
      search: true,
      contextWindow: 372000,
    });
  });
});