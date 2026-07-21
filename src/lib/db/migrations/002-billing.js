// Add managed API-key billing. All money is integer micro-USD.
export default {
  version: 2,
  name: "billing",
  up(db) {
    const columns = new Set(db.all("PRAGMA table_info(apiKeys)").map((r) => r.name));
    const add = (name, definition) => { if (!columns.has(name)) db.exec(`ALTER TABLE apiKeys ADD COLUMN ${name} ${definition}`); };
    add("creditBalance", "INTEGER NOT NULL DEFAULT 0");
    add("totalTopup", "INTEGER NOT NULL DEFAULT 0");
    add("totalSpent", "INTEGER NOT NULL DEFAULT 0");
    add("allowedModels", "TEXT NOT NULL DEFAULT '[]'");
    add("allowedCombos", "TEXT NOT NULL DEFAULT '[]'");
    add("notes", "TEXT");
    add("updatedAt", "TEXT NOT NULL DEFAULT ''");
    const comboColumns = new Set(db.all("PRAGMA table_info(combos)").map((r) => r.name));
    if (!comboColumns.has("pricing")) db.exec("ALTER TABLE combos ADD COLUMN pricing TEXT");
    db.exec(`CREATE TABLE IF NOT EXISTS billingLedger (
      id TEXT PRIMARY KEY, apiKeyId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('topup', 'adjustment', 'debit')),
      amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'USD', calculatedAmount INTEGER,
      billingModel TEXT, requestedModel TEXT, comboId TEXT, usageHistoryId INTEGER, requestId TEXT,
      tokens TEXT NOT NULL DEFAULT '{}', description TEXT, createdBy TEXT, createdAt TEXT NOT NULL,
      FOREIGN KEY(apiKeyId) REFERENCES apiKeys(id) ON DELETE CASCADE,
      FOREIGN KEY(usageHistoryId) REFERENCES usageHistory(id) ON DELETE SET NULL
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS idx_bl_key_created ON billingLedger(apiKeyId, createdAt DESC)");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_bl_usage_once ON billingLedger(usageHistoryId) WHERE usageHistoryId IS NOT NULL");
    db.exec("UPDATE apiKeys SET creditBalance=COALESCE(creditBalance,0), totalTopup=COALESCE(totalTopup,0), totalSpent=COALESCE(totalSpent,0), allowedModels=COALESCE(allowedModels,'[]'), allowedCombos=COALESCE(allowedCombos,'[]'), updatedAt=CASE WHEN updatedAt='' THEN createdAt ELSE updatedAt END");
  },
};
