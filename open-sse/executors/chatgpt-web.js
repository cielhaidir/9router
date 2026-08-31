import { DefaultExecutor } from "./default.js";

// Local Responses-API bridge (codex-chatgpt-web). Default host root comes from
// the registry transport; per-connection overrides land in
// credentials.providerSpecificData.baseUrl (see AddApiKeyModal bridge URL field).
export class ChatgptWebExecutor extends DefaultExecutor {
  constructor() {
    super("chatgpt-web");
  }

  buildUrl(model, stream, urlIndex = 0, credentials = null) {
    const raw = (credentials?.providerSpecificData?.baseUrl || this.config.baseUrl)
      .trim()
      .replace(/\/$/, "");
    return raw.endsWith("/responses") ? raw : `${raw}/v1/responses`;
  }
}

export default ChatgptWebExecutor;