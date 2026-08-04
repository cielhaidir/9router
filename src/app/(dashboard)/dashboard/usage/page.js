"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UsageStats, RequestLogger, CardSkeleton, SegmentedControl } from "@/shared/components";
import RequestDetailsTab from "./components/RequestDetailsTab";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "60d", label: "60D" },
];

const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: String(hour), label: `${String(hour).padStart(2, "0")}:00` }));
const END_HOURS = Array.from({ length: 24 }, (_, index) => {
  const hour = index + 1;
  return { value: String(hour), label: `${String(hour % 24).padStart(2, "0")}:00` };
});

export default function UsagePage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <UsageContent />
    </Suspense>
  );
}

function UsageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [period, setPeriod] = useState("today");
  const [hourStart, setHourStart] = useState("");
  const [hourEnd, setHourEnd] = useState("");
  const endHours = useMemo(() => END_HOURS.filter((h) => !hourStart || Number(h.value) > Number(hourStart)), [hourStart]);

  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && ["overview", "logs", "details"].includes(tabFromUrl)
    ? tabFromUrl
    : "overview";

  const handleTabChange = (value) => {
    if (value === activeTab) return;
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`/dashboard/usage?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 px-1 sm:px-0">
      {/* Tabs + period selector on same row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={[
            { value: "overview", label: "Overview" },
            { value: "details", label: "Details" },
          ]}
          value={activeTab}
          onChange={handleTabChange}
          className="w-full sm:w-auto"
        />
        {activeTab === "overview" && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} size="sm" className="w-full sm:w-auto" />
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span>Hours</span>
              <select aria-label="Start hour" value={hourStart} onChange={(e) => { setHourStart(e.target.value); setHourEnd(""); }} className="rounded border border-border bg-bg px-2 py-1.5 text-text">
                <option value="">From</option>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <span>–</span>
              <select aria-label="End hour" value={hourEnd} onChange={(e) => setHourEnd(e.target.value)} disabled={!hourStart} className="rounded border border-border bg-bg px-2 py-1.5 text-text disabled:opacity-50">
                <option value="">To</option>
                {endHours.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              {(hourStart || hourEnd) && <button type="button" onClick={() => { setHourStart(""); setHourEnd(""); }} className="px-1 text-text-muted hover:text-text">Clear</button>}
            </div>
          </div>
        )}
      </div>

      {activeTab === "overview" && (
        <Suspense fallback={<CardSkeleton />}>
          <UsageStats period={period} setPeriod={setPeriod} hourStart={hourStart === "" ? null : Number(hourStart)} hourEnd={hourEnd === "" ? null : Number(hourEnd)} />
        </Suspense>
      )}
      {activeTab === "logs" && <RequestLogger />}
      {activeTab === "details" && <RequestDetailsTab />}
    </div>
  );
}
