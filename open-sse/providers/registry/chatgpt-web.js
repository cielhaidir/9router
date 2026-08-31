// Local bridge "codex-chatgpt-web" — OpenAI-compatible Responses API served from
// the same machine (bind 127.0.0.1), backed by a ChatGPT Web session (no API key).
// Base URL is the bridge host root; the executor appends /v1/responses.
// Per-connection override: set connection providerSpecificData.baseUrl (host root).
export default {
  id: "chatgpt-web",
  alias: "cgw",
  category: "apikey",
  noAuth: true,
  display: {
    name: "ChatGPT Web",
    icon: "chat",
    color: "#10A37F",
    textIcon: "CW",
    website: "https://chatgpt.com",
    notice: {
      text: "Local bridge (codex-chatgpt-web) — uses a ChatGPT Web session instead of an API key. Only reachable from this machine (127.0.0.1:17841).",
    },
  },
  thinkingConfig: {
    options: ["auto", "low", "medium", "high", "xhigh", "max"],
    defaultMode: "auto",
  },
  transport: {
    baseUrl: "http://127.0.0.1:17841",
    format: "openai-responses",
    validateUrl: "http://127.0.0.1:17841/v1/models",
    forceStream: true,
    // Bridge needs no credential — don't send "Bearer undefined" like combined auth does.
    auth: { header: "Authorization", scheme: "bearer", combined: false },
  },
  serviceKinds: ["llm"],
  models: [
    { id: "gpt-5.6-luna", name: "ChatGPT Web Luna" },
    { id: "gpt-5.6-sol", name: "ChatGPT Web Sol" },
  ],
};