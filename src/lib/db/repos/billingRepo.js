import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";

const MICRO_USD = 1_000_000;
const token = (value) => Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);

/** Convert a decimal USD-per-million string to exact micro-USD. */
export function normalizeRateToMicrosPerMillion(value) {
  if (typeof value === "number") value = String(value);
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(value.trim())) throw new Error("Rate must be a non-negative decimal with at most 6 places");
  const [whole, fraction = ""] = value.trim().split(".");
  const result = BigInt(whole) * BigInt(MICRO_USD) + BigInt((fraction + "000000").slice(0, 6));
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Rate is unsafe");
  return Number(result);
}

export function calculateChargeMicros(tokens = {}, rate = {}) {
  const input = token(tokens.prompt_tokens ?? tokens.input_tokens);
  const cached = Math.min(input, token(tokens.cached_tokens ?? tokens.cache_read_input_tokens));
  const output = token(tokens.completion_tokens ?? tokens.output_tokens);
  const reasoning = token(tokens.reasoning_tokens ?? tokens.completion_tokens_details?.reasoning_tokens);
  const total = (input - cached) * token(rate.inputMicrosPerMillion) + cached * token(rate.cachedMicrosPerMillion)
    + output * token(rate.outputMicrosPerMillion) + reasoning * token(rate.reasoningMicrosPerMillion);
  return Math.round(total / MICRO_USD);
}

export function resolveBillingRate({ combo, provider, model, pricing }) {
  if (combo?.pricing?.enabled !== false) return combo?.pricing || null;
  const p = pricing || null;
  if (!p) return null;
  return {
    inputMicrosPerMillion: token(p.inputMicrosPerMillion ?? p.input * MICRO_USD),
    outputMicrosPerMillion: token(p.outputMicrosPerMillion ?? p.output * MICRO_USD),
    cachedMicrosPerMillion: token(p.cachedMicrosPerMillion ?? p.cached * MICRO_USD),
    reasoningMicrosPerMillion: token(p.reasoningMicrosPerMillion ?? p.reasoning * MICRO_USD),
  };
}

export function assertApiKeyCanUse({ apiKey, requestedModel, isCombo }) {
  if (!apiKey?.isActive) throw new Error("API key is disabled");
  if (Number(apiKey.creditBalance) <= 0) throw new Error("insufficient credit balance");
  const allowed = isCombo ? apiKey.allowedCombos : apiKey.allowedModels;
  if (Array.isArray(allowed) && allowed.length && !allowed.includes(requestedModel)) {
    throw new Error(isCombo ? "requested combo is not allowed for this API key" : "requested model is not allowed for this API key");
  }
  return true;
}

function ledgerRow(row) { return row && { ...row, tokens: parseJson(row.tokens, {}) }; }
function keyExists(db, id) { return db.get("SELECT id FROM apiKeys WHERE id = ?", [id]); }
async function mutate(apiKeyId, amount, type, { description = null, createdBy = null } = {}) {
  if (!Number.isSafeInteger(amount) || (type === "topup" ? amount <= 0 : amount === 0)) throw new Error("Invalid amount");
  const db = await getAdapter(); let ledger;
  db.transaction(() => {
    if (!keyExists(db, apiKeyId)) throw new Error("API key not found");
    const now = new Date().toISOString();
    ledger = { id: uuidv4(), apiKeyId, type, amount, currency: "USD", tokens: "{}", description, createdBy, createdAt: now };
    db.run("INSERT INTO billingLedger(id,apiKeyId,type,amount,currency,tokens,description,createdBy,createdAt) VALUES(?,?,?,?,?,?,?,?,?)", [ledger.id,ledger.apiKeyId,ledger.type,ledger.amount,ledger.currency,ledger.tokens,ledger.description,ledger.createdBy,ledger.createdAt]);
    const topup = type === "topup" ? amount : 0;
    db.run("UPDATE apiKeys SET creditBalance=creditBalance+?, totalTopup=totalTopup+?, updatedAt=? WHERE id=?", [amount, topup, now, apiKeyId]);
  }); return ledgerRow(ledger);
}
export const applyTopup = (id, amount, opts) => mutate(id, amount, "topup", opts);
export const applyAdjustment = (id, amount, opts) => mutate(id, amount, "adjustment", opts);

export async function applyUsageDebit({ apiKeyId, usageHistoryId, requestId, requestedModel, billingModel, comboId, tokens, rate }) {
  const calculatedAmount = calculateChargeMicros(tokens, rate);
  if (!calculatedAmount) return { chargedAmount: 0, calculatedAmount: 0, depleted: false, ledger: null };
  const db = await getAdapter(); let result;
  db.transaction(() => {
    const prior = db.get("SELECT * FROM billingLedger WHERE usageHistoryId=?", [usageHistoryId]);
    if (prior) { result = { chargedAmount: -prior.amount, calculatedAmount: prior.calculatedAmount ?? -prior.amount, depleted: false, ledger: ledgerRow(prior) }; return; }
    const key = db.get("SELECT creditBalance FROM apiKeys WHERE id=?", [apiKeyId]);
    if (!key) throw new Error("API key not found");
    const chargedAmount = Math.min(Math.max(0, Number(key.creditBalance) || 0), calculatedAmount);
    const now = new Date().toISOString();
    const ledger = { id: uuidv4(), apiKeyId, type: "debit", amount: -chargedAmount, currency: "USD", calculatedAmount, billingModel, requestedModel, comboId, usageHistoryId, requestId, tokens: stringifyJson(tokens || {}), createdAt: now };
    db.run("INSERT INTO billingLedger(id,apiKeyId,type,amount,currency,calculatedAmount,billingModel,requestedModel,comboId,usageHistoryId,requestId,tokens,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", Object.values(ledger));
    db.run("UPDATE apiKeys SET creditBalance=creditBalance-?, totalSpent=totalSpent+?, updatedAt=? WHERE id=?", [chargedAmount, chargedAmount, now, apiKeyId]);
    result = { chargedAmount, calculatedAmount, depleted: chargedAmount >= Number(key.creditBalance), ledger: ledgerRow(ledger) };
  }); return result;
}
export async function getApiKeyLedger(apiKeyId, { limit = 50, cursor } = {}) { const db = await getAdapter(); const params=[apiKeyId]; let where="apiKeyId=?"; if(cursor){where+=" AND createdAt < ?";params.push(cursor);} params.push(Math.min(100,Math.max(1,Number(limit)||50))); return db.all(`SELECT * FROM billingLedger WHERE ${where} ORDER BY createdAt DESC LIMIT ?`,params).map(ledgerRow); }
export async function getBillingOverview() { const db=await getAdapter(); const totals=db.get("SELECT COALESCE(SUM(creditBalance),0) balance, COALESCE(SUM(totalTopup),0) topup, COALESCE(SUM(totalSpent),0) spent FROM apiKeys"); return { creditBalance: totals.balance, totalTopup: totals.topup, totalSpent: totals.spent, keys: db.all("SELECT id,name,isActive,creditBalance,totalTopup,totalSpent FROM apiKeys ORDER BY createdAt ASC") }; }
