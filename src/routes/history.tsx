import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownUp,
  ChevronRight,
  Link2,
  MessageSquareText,
  Search,
  ShieldPlus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RiskBadge } from "@/components/brand";
import { Confirm } from "@/components/confirm";
import type { RiskLevel } from "@/lib/analyze";
import { scanStore, useScans } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — ScamShield AI" },
      { name: "description", content: "Search, filter, and review your past scam scan reports." },
      { property: "og:title", content: "Scan History — ScamShield AI" },
      { property: "og:description", content: "Review your past scam scan reports." },
    ],
  }),
  component: History,
});

const FILTERS: { key: "all" | RiskLevel; label: string }[] = [
  { key: "all", label: "All" },
  { key: "low", label: "Low risk" },
  { key: "caution", label: "Suspicious" },
  { key: "high", label: "High risk" },
];

function History() {
  const scans = useScans();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [newest, setNewest] = useState(true);

  const list = useMemo(
    () =>
      scans
        .filter(
          (s) =>
            (filter === "all" || s.level === filter) &&
            (s.label + s.input).toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) => (newest ? b.createdAt - a.createdAt : a.createdAt - b.createdAt)),
    [scans, q, filter, newest],
  );

  if (scans.length === 0)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <div className="grid size-24 place-items-center rounded-3xl bg-gradient-to-br from-primary/20 to-brand-blue/20 text-primary">
          <ShieldPlus className="size-12" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">No scans yet</h1>
        <p className="mt-2 text-muted-foreground">
          Check a suspicious link or message and your reports will show up here.
        </p>
        <Link to="/scan" className="btn btn-primary mt-6">
          Start your first scan
        </Link>
      </div>
    );

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Your scan history</h1>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scans"
            aria-label="Search scans"
            className="field pl-12"
          />
        </div>
        <button
          onClick={() => setNewest(!newest)}
          className="btn btn-ghost"
          aria-label="Toggle sort"
        >
          <ArrowDownUp className="size-4" />
          <span className="hidden sm:inline">{newest ? "Newest" : "Oldest"}</span>
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary/15 text-primary"
                : "bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="card-surface p-8 text-center text-muted-foreground">
          No scans match your filters.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="card-surface flex items-center gap-3 p-3 pr-2">
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                {s.type === "url" ? (
                  <Link2 className="size-5" />
                ) : (
                  <MessageSquareText className="size-5" />
                )}
              </div>
              <Link to="/report/$id" params={{ id: s.id }} className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(s.createdAt).toLocaleString()}</span>
                  <RiskBadge level={s.level} className="py-0.5" />
                </div>
              </Link>
              <span className="hidden font-display text-xl font-bold tabular-nums sm:block">
                {s.score}
              </span>
              <Confirm
                trigger={
                  <button
                    aria-label="Delete report"
                    className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                }
                title="Delete this report?"
                description="This removes the report from this device. It can't be undone."
                action="Delete"
                onConfirm={async () => {
                  try {
                    await scanStore.remove(s.id);
                    toast.success("Report deleted");
                  } catch (cause) {
                    toast.error(
                      cause instanceof Error ? cause.message : "Could not delete report.",
                    );
                  }
                }}
              />
              <Link
                to="/report/$id"
                params={{ id: s.id }}
                aria-label="View report"
                className="hidden size-11 place-items-center text-muted-foreground sm:grid"
              >
                <ChevronRight className="size-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
