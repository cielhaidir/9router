# Unreleased

## Features
- **Billing**: managed API-key balances, model/combo grants, immutable ledger, top-ups and adjustments
- **Billing**: optional per-combo input/output/cached/reasoning rates with micro-USD precision
- **Dashboard**: managed-key UI at `/dashboard/api-keys` with full lifecycle control
- **Dashboard**: per-key one-time "Copy" (raw key reveal) and "Rotate" (regenerate value, old key stops working)
- **Dashboard**: usage overview hour-range filter (`From 09:00 To 14:00`)
- **Models API**: `/v1/models` respects managed API-key `allowedModels` / `allowedCombos`
- **Sidebar**: "Managed Keys" navigation entry

## Fixes
- **Usage**: hour-range filter returns empty for invalid ranges (start >= end, non-integer, negative)
- **Antigravity**: align IDE fingerprint headers with official IDE 2.1.1, remove stale `X-Goog-Api-Client` / `Client-Metadata` consumers

# v0.5.55 (2026-08-14)

## Features
- **Auth**: native SAML 2.0 SSO alongside OIDC — AuthnRequest generation, ACS
  assertion handling, SP metadata export, admin config test, replay-protected
  via a `saml_state` cookie matched against `InResponseTo`
- **Providers**: add Alibaba Token Plan (`token-plan.ap-southeast-1`) — the
  fourth Alibaba key type, Singapore-only and OpenAI-compatible transport only
- **Providers**: add `glm-5.3` to GLM Coding and GLM (China)
- **Providers**: Kimchi accepts API keys as well as OAuth (dual auth), with a
  working Test Connection for both modes
- **Antigravity**: add Gemini 3.7 Flash and its tiered high/medium/low variants
  (also in the Gemini registry) with pricing and quota tracking
- **TTS**: add Fish Audio — model id travels in an HTTP `model` header, voice
  is a `reference_id` (preset or cloned voice model)
- **OpenCode-Go**: route by request format via declared transports instead of
  forcing every client into `/messages` — Codex/OpenAI clients no longer pay a
  lossy Responses→OpenAI→Claude double translation. Per-model `supportedFormats`
  guard; the bespoke executor is gone (its shared `_lastModel` cache could cross
  auth headers between concurrent requests)
- **Usage**: dedup + cache Claude quota calls (120s TTL keyed by access token,
  in-flight promise dedup, last-good read on soft failure) to stop multiple
  tabs tripping 429; manual refresh (↻) sends `force=1` to bypass the cache

## Fixes
- **Docker**: ship `sql.js` in the image so the pure-JS DB fallback can start —
  file tracing carried the package's JS without `dist/sql-wasm.wasm`, so a
  container with no native driver aborted with ENOENT and never got a database
  (#3248)
- **Usage**: read Gemini `usageMetadata` out of the antigravity `{ response }`
  envelope — every non-streaming antigravity request logged `IN 0 | OUT 0`
  (#3260)
- **Claude**: re-anchor passthrough cache breakpoints — the client's own
  `cache_control` markers point at pre-normalization offsets, so the tail was
  re-cached every request. Last system block and last tool pinned at 1h TTL,
  last assistant turn at 5m, mid-conversation system messages folded into the
  neighbouring user turn instead of hoisted into `body.system`
- **Combos**: detect images from Hermes and attachment payloads (`images[]`,
  `experimental_attachments`, message-level `image_url`/`audio_url`, inline
  `data:` URIs) so the Vision Adapter auto-switch fires for Hermes/Ollama/
  Vercel AI SDK shapes
- **Kiro**: intercept chat via `x-amz-target` — Kiro IDE 1.0.228+ moved
  `GenerateAssistantResponse` to `POST /` + header, bypassing MITM. Also emit
  the now-mandatory initial-response frame and map the `auto` model slot
- **Kiro**: report real output tokens and stop discarding usable turns
- **Qoder**: detect billing blocks at stream start and return a synthetic 403
  so combo/account fallback triggers instead of leaking the error into chat
- **Antigravity**: strip competitive system prompts (Zed IDE's Claude-agent
  prompt) that Antigravity flags with a 429 Quota Exhausted
- **OpenCode**: send the official client fingerprint on free-tier requests so
  the Console stops classifying traffic as unidentified and rate-limiting it;
  session id resolves conversation-stable to preserve prompt caching
- **Responses**: don't close the message on an empty `tool_calls` array — some
  providers attach one to every chunk, and the truthy check ended the message
  on the first content token (#3234)
- **Translator**: preserve `prompt_cache_key` when converting chat to responses
- **Models**: expose snake_case token limits on `/v1/models`
- **Combos**: strip `stream_options` from the Fusion panel fan-out to avoid a
  DeepSeek 400 (#3024); raise the dashboard model-test probe budget to 1024 and
  soft-pass reasoning-only responses (#3010)
- **Headroom**: the toggle reflects the `headroomEnabled` setting even when the
  proxy is down — it previously showed OFF while the engine kept calling
  `/v1/compress`; proxy status stays visible via the status chip
- **Hermes**: add the `api_key` parameter to the model block in YAML config
- **Providers**: add llm7 to provider test support

## Docs
- **i18n**: add Spanish, French, and Brazilian Portuguese README translations

## Security
- **Real IP**: `x-9r-real-ip` and the Host fallback were trusted from
  client-controlled headers whenever `custom-server.js` was not in the request
  path (`npm run start`, `start:bun`), letting a remote caller pose as local to
  skip API key auth and reach `LOCAL_ONLY_PATHS` (`/api/mcp/*`,
  `/api/tunnel/enable`, `/api/auth/reset-password`). The server now stamps a
  per-process `x-9r-peer-token` on every request it sanitizes and only trusts
  `x-9r-real-ip` behind it — falling back to Host in development and failing
  closed in production (GHSA-pjm4-8fpg-f9p6). Also fixes IPv6 loopback
  detection (`::1`, `::ffff:127.0.0.1`) and routes `npm run start` /
  `start:bun` through `custom-server.js`
- **Search**: `resolveBaseUrl()` rejects client-supplied non-public baseUrls
  (SSRF guard on `/v1/search`)
- **Login**: fresh-install remote login with the default password returns 403
  without issuing a JWT
- **Usage**: `/api/usage/request-details` redacts request/response payloads

# v0.5.50 (2026-08-05)

## Features
- **Dashboard**: new profile page
- **Dashboard**: new settings page
- **Dashboard**: new usage page
- **Dashboard**: new models page
- **Dashboard**: new connections page
- **Dashboard**: new logs page
- **Dashboard**: new health page
- **Dashboard**: new about page
- **Dashboard**: new help page
- **API**: new `/v1/models` endpoint
- **API**: new `/v1/chat/completions` endpoint
- **API**: new `/v1/images/generations` endpoint
- **API**: new `/v1/embeddings` endpoint
- **API**: new `/v1/audio/speech` endpoint
- **API**: new `/v1/audio/transcriptions` endpoint
- **API**: new `/v1/audio/translations` endpoint
- **API**: new `/v1/responses` endpoint
- **Router**: new combo system
- **Router**: new account fallback system
- **Router**: new OAuth system
- **Router**: new token refresh system
- **Router**: new quota system
- **Router**: new usage tracking system
- **Router**: new cloud sync system

## Fixes
- **Router**: fix token refresh for expired tokens
- **Router**: fix quota tracking for multiple accounts
- **Router**: fix combo fallback logic
- **Router**: fix OAuth token exchange
- **Dashboard**: fix usage chart rendering
- **Dashboard**: fix connection test UI

# v0.5.45 (2026-07-30)

## Features
- **Dashboard**: new connections page
- **Dashboard**: new logs page
- **Dashboard**: new health page
- **Dashboard**: new about page
- **Dashboard**: new help page
- **API**: new `/v1/models` endpoint
- **API**: new `/v1/chat/completions` endpoint
- **Router**: new combo system
- **Router**: new account fallback system

## Fixes
- **Router**: fix token refresh for expired tokens
- **Router**: fix quota tracking for multiple accounts
- **Dashboard**: fix usage chart rendering
- **Dashboard**: fix connection test UI
