"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardSkeleton, Input, Modal, SegmentedControl } from "@/shared/components";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

const dollars = (micros = 0) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(micros || 0) / 1_000_000);
const dateTime = (value) => value ? new Date(value).toLocaleString() : "—";

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState([]);
  const [models, setModels] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [billing, setBilling] = useState(null);
  const [createdKey, setCreatedKey] = useState(null);
  const [rotatedKey, setRotatedKey] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  const handleFailure = useCallback((err) => {
    if (/\(401\)|unauthorized/i.test(err.message)) router.replace("/login");
    else setError(err.message || "Something went wrong");
  }, [router]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [keyData, modelData, comboData] = await Promise.all([
        fetch("/api/billing/keys", { cache: "no-store" }).then(readJson),
        fetch("/api/models", { cache: "no-store" }).then(readJson),
        fetch("/api/combos", { cache: "no-store" }).then(readJson),
      ]);
      setKeys(keyData.keys || []);
      setModels(modelData.models || []);
      setCombos((comboData.combos || []).filter((combo) => !combo.kind || combo.kind === "llm"));
    } catch (err) { handleFailure(err); }
    finally { setLoading(false); }
  }, [handleFailure]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const createKey = async (payload) => {
    try {
      const data = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(readJson);
      setCreateOpen(false);
      setCreatedKey(data.key); // Deliberately transient: never retained in the key list.
      await load();
    } catch (err) { handleFailure(err); throw err; }
  };
  const updateKey = async (id, payload) => {
    try {
      await fetch(`/api/keys/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(readJson);
      setEditing(null); await load();
    } catch (err) { handleFailure(err); throw err; }
  };
  const copyKey = async (id) => {
    try {
      const data = await fetch(`/api/keys/${id}/reveal`, { method: "POST" }).then(readJson);
      copy(data.key, id); // Transient: raw value goes straight to the clipboard, never into React state.
    } catch (err) { handleFailure(err); }
  };
  const rotateKey = async (id) => {
    try {
      const data = await fetch(`/api/keys/${id}/rotate`, { method: "POST" }).then(readJson);
      setRotatedKey(data.key); // Deliberately transient: shown once in RawKeyModal, never retained in the key list.
      await load();
    } catch (err) { handleFailure(err); }
  };

  if (loading) return <div className="flex flex-col gap-6"><CardSkeleton /><CardSkeleton /></div>;
  return <div className="flex min-w-0 flex-col gap-6 px-1 sm:px-0">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-semibold text-text-main">Managed API Keys</h2><p className="mt-1 text-sm text-text-muted">Issue restricted keys, manage credit, and review billing activity.</p></div>
      <Button icon="add" onClick={() => setCreateOpen(true)}>Create Key</Button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}<button className="ml-3 underline" onClick={() => setError("")}>Dismiss</button></div>}
    {keys.length === 0 ? <Card><div className="py-12 text-center"><span className="material-symbols-outlined mb-3 text-4xl text-primary">key</span><p className="font-medium">No managed API keys yet</p><p className="mt-1 text-sm text-text-muted">Create a key to assign model access and prepaid credit.</p><Button className="mt-4" icon="add" onClick={() => setCreateOpen(true)}>Create Key</Button></div></Card> :
      <div className="grid gap-4 xl:grid-cols-2">{keys.map((key) => <KeyCard key={key.id} apiKey={key} copied={copied === key.id} onCopy={() => copyKey(key.id)} onEdit={() => setEditing(key)} onBilling={() => setBilling(key)} onRotate={() => rotateKey(key.id)} />)}</div>}
    {createOpen && <KeyFormModal title="Create Managed Key" models={models} combos={combos} onClose={() => setCreateOpen(false)} onSave={createKey} />}
    {editing && <KeyFormModal title="Edit Managed Key" apiKey={editing} models={models} combos={combos} onClose={() => setEditing(null)} onSave={(data) => updateKey(editing.id, data)} />}
    {billing && <BillingModal apiKey={billing} onClose={() => setBilling(null)} onChanged={load} onFailure={handleFailure} />}
    {createdKey && <RawKeyModal value={createdKey} onClose={() => setCreatedKey(null)} />}
    {rotatedKey && <RawKeyModal value={rotatedKey} onClose={() => setRotatedKey(null)} />}
  </div>;
}

function KeyCard({ apiKey, copied, onCopy, onEdit, onBilling, onRotate }) {
  const disabled = !apiKey.isActive;
  return <Card padding="sm"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">key</span><h3 className="truncate font-semibold">{apiKey.name}</h3><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${apiKey.isActive ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-600"}`}>{apiKey.isActive ? "Active" : "Disabled"}</span></div><code className="mt-2 block font-mono text-xs text-text-muted">{apiKey.maskedKey}</code>{apiKey.notes && <p className="mt-2 line-clamp-2 text-xs text-text-muted">{apiKey.notes}</p>}</div><div className="grid grid-cols-3 gap-3 text-right text-xs"><Metric label="Balance" value={dollars(apiKey.creditBalance)} /><Metric label="Top up" value={dollars(apiKey.totalTopup)} /><Metric label="Spent" value={dollars(apiKey.totalSpent)} /></div></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3"><p className="text-xs text-text-muted">{apiKey.allowedModels?.length || 0} direct models · {apiKey.allowedCombos?.length || 0} combos</p><div className="flex gap-2"><Button size="sm" variant="secondary" icon={copied ? "check" : "content_copy"} disabled={disabled} onClick={onCopy}>{copied ? "Copied" : "Copy"}</Button><Button size="sm" variant="outline" icon="refresh" disabled={disabled} onClick={onRotate}>Rotate</Button><Button size="sm" variant="secondary" icon="edit" onClick={onEdit}>Edit</Button><Button size="sm" variant="outline" icon="account_balance_wallet" onClick={onBilling}>Billing</Button></div></div></Card>;
}
function Metric({ label, value }) { return <div><p className="text-text-muted">{label}</p><p className="mt-0.5 font-semibold text-text-main">{value}</p></div>; }

function KeyFormModal({ title, apiKey, models, combos, onClose, onSave }) {
  const [name, setName] = useState(apiKey?.name || ""); const [notes, setNotes] = useState(apiKey?.notes || ""); const [isActive, setActive] = useState(apiKey?.isActive ?? true);
  const [allowedModels, setModels] = useState(apiKey?.allowedModels || []); const [allowedCombos, setCombos] = useState(apiKey?.allowedCombos || []); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const toggle = (value, values, setValues) => setValues(values.includes(value) ? values.filter((x) => x !== value) : [...values, value]);
  const save = async () => { if (!name.trim()) return setError("Name is required"); setSaving(true); setError(""); try { const payload = { name: name.trim(), notes, allowedModels, allowedCombos }; if (apiKey) payload.isActive = isActive; await onSave(payload); } catch (err) { setError(err.message); setSaving(false); } };
  return <Modal isOpen onClose={onClose} title={title} size="xl"><div className="flex flex-col gap-5"><Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Production service" /><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} /> Key is active</label><Allowlist label="Allowed direct models" hint="No selection allows every direct model." options={models.map((m) => ({ value: m.routedModel || m.fullModel, label: m.alias || m.routedModel || m.fullModel }))} values={allowedModels} onToggle={(value) => toggle(value, allowedModels, setModels)} /><Allowlist label="Allowed combos" hint="No selection allows every combo." options={combos.map((c) => ({ value: c.name, label: c.name }))} values={allowedCombos} onToggle={(value) => toggle(value, allowedCombos, setCombos)} /><label className="flex flex-col gap-1.5 text-sm font-medium">Notes<textarea value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} className="min-h-20 rounded-[10px] border border-transparent bg-surface-2 px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="Internal note (optional)" /></label>{error && <p role="alert" className="text-sm text-red-500">{error}</p>}<div className="flex gap-2"><Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button><Button fullWidth loading={saving} onClick={save}>{apiKey ? "Save changes" : "Create key"}</Button></div></div></Modal>;
}
function Allowlist({ label, hint, options, values, onToggle }) { return <div><div className="flex items-baseline justify-between gap-2"><label className="text-sm font-medium">{label}</label><span className="text-xs text-text-muted">{values.length} selected</span></div><p className="mt-1 text-xs text-text-muted">{hint}</p><div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-border-subtle p-2">{options.length ? options.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-2"><input type="checkbox" checked={values.includes(option.value)} onChange={() => onToggle(option.value)} /><code className="truncate text-xs">{option.label}</code></label>) : <p className="p-2 text-xs text-text-muted">No options available.</p>}</div></div>; }

function BillingModal({ apiKey, onClose, onChanged, onFailure }) {
  const [tab, setTab] = useState("ledger"); const [ledger, setLedger] = useState([]); const [activity, setActivity] = useState([]); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { try { const [l, a] = await Promise.all([fetch(`/api/keys/${apiKey.id}/ledger`).then(readJson), fetch(`/api/keys/${apiKey.id}/activity`).then(readJson)]); setLedger(l.ledger || []); setActivity(a.activity || []); } catch (err) { onFailure(err); } }, [apiKey.id, onFailure]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const mutate = async (type) => { setError(""); setBusy(true); try { await fetch(`/api/keys/${apiKey.id}/${type === "topup" ? "topups" : "adjustments"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountUsd: amount, description }) }).then(readJson); setAmount(""); setDescription(""); await Promise.all([load(), onChanged()]); } catch (err) { setError(err.message); onFailure(err); } finally { setBusy(false); } };
  return <Modal isOpen onClose={onClose} title={`Billing · ${apiKey.name}`} size="xl"><div className="flex flex-col gap-4"><div className="rounded-lg bg-surface-2 p-3 text-sm"><span className="text-text-muted">Current balance </span><strong>{dollars(apiKey.creditBalance)}</strong></div><SegmentedControl options={[{ value: "ledger", label: "Ledger" }, { value: "activity", label: "Activity" }]} value={tab} onChange={setTab} />{tab === "ledger" ? <Ledger rows={ledger} /> : <Activity rows={activity} />}<div className="border-t border-border-subtle pt-4"><p className="mb-2 text-sm font-semibold">Credit action</p><div className="grid gap-2 sm:grid-cols-2"><Input label="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10.00 (adjustments may be negative)" /><Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" /></div>{error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}<div className="mt-3 flex gap-2"><Button size="sm" loading={busy} disabled={!amount} onClick={() => mutate("topup")}>Top up</Button><Button size="sm" variant="secondary" loading={busy} disabled={!amount} onClick={() => mutate("adjustment")}>Adjustment</Button></div></div></div></Modal>;
}
function Ledger({ rows }) { return <div className="max-h-56 overflow-y-auto rounded-lg border border-border-subtle">{rows.length ? rows.map((row) => <div key={row.id} className="flex justify-between gap-3 border-b border-border-subtle p-3 text-xs last:border-0"><div><p className="font-medium capitalize">{row.type}{row.description ? ` · ${row.description}` : ""}</p><p className="mt-1 text-text-muted">{dateTime(row.createdAt)} {row.requestedModel && `· ${row.requestedModel}`}</p></div><strong className={row.amount < 0 ? "text-red-500" : "text-green-600"}>{row.amount > 0 ? "+" : ""}{dollars(row.amount)}</strong></div>) : <p className="p-5 text-center text-sm text-text-muted">No ledger entries yet.</p>}</div>; }
function Activity({ rows }) { return <div className="max-h-56 overflow-y-auto rounded-lg border border-border-subtle">{rows.length ? rows.map((row) => <div key={row.id} className="flex justify-between gap-3 border-b border-border-subtle p-3 text-xs last:border-0"><div><p className="font-medium">{row.provider}/{row.model}</p><p className="mt-1 text-text-muted">{dateTime(row.timestamp)} · {row.status || "completed"}</p></div><div className="text-right"><p>{Number(row.tokens?.total_tokens || 0).toLocaleString()} tokens</p>{row.amount != null && <p className="mt-1 text-red-500">-{dollars(Math.abs(row.amount))}</p>}</div></div>) : <p className="p-5 text-center text-sm text-text-muted">No request activity yet.</p>}</div>; }
function RawKeyModal({ value, onClose }) { const { copied, copy } = useCopyToClipboard(); return <Modal isOpen onClose={onClose} title="Copy your new API key" closeOnOverlay={false}><div className="flex flex-col gap-4"><div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">This key is shown only once. Store it securely now; it cannot be recovered later.</div><code className="break-all rounded-lg bg-surface-2 p-3 text-sm">{value}</code><Button icon={copied ? "check" : "content_copy"} onClick={() => copy(value)}> {copied ? "Copied" : "Copy key"}</Button><Button variant="ghost" onClick={onClose}>I stored it</Button></div></Modal>; }
