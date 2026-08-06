# Unreleased

## Features
- **Billing**: managed API-key balances, model/combo grants, immutable ledger, top-ups and adjustments
- **Billing**: optional per-combo input/output/cached/reasoning rates with micro-USD precision
- **Dashboard**: managed-key UI at `/dashboard/api-keys` with full lifecycle control
- **Dashboard**: usage overview hour-range filter (`From 09:00 To 14:00`)
- **Models API**: `/v1/models` respects managed API-key `allowedModels` / `allowedCombos`
- **Sidebar**: "Managed Keys" navigation entry

## Fixes
- **Usage**: hour-range filter returns empty for invalid ranges (start >= end, non-integer, negative)
- **Antigravity**: align IDE fingerprint headers with official IDE 2.1.1, remove stale `X-Goog-Api-Client` / `Client-Metadata` consumers

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
