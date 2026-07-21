import { assertApiKeyCanUse, getApiKeyByValue } from "@/lib/db/index.js";
export async function authenticatedBillingKey(value) { return value ? getApiKeyByValue(value) : null; }
export function authorizeBillingRequest({ key, requestedModel, isCombo }) { if (!key) return; assertApiKeyCanUse({ apiKey:key, requestedModel, isCombo }); }
