import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Eye,
  Flag,
  HelpCircle,
  Link2,
  MessageSquareText,
  RotateCcw,
  Share2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiskBadge, RiskGauge } from "@/components/brand";
import { ACTIONS, LEVEL_META } from "@/lib/analyze";
import { scanStore, useScans } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [
      { title: "Scan Report — ScamShield AI" },
      {
        name: "description",
        content: "Estimated scam risk, warning signs, and recommended next steps.",
      },
      { property: "og:title", content: "Scan Report — ScamShield AI" },
      { property: "og:description", content: "Estimated scam risk and safety recommendations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Report,
});

const toneText = { safe: "text-safe", warn: "text-warn", danger: "text-danger" };
const toneBg = {
  safe: "bg-safe/10 border-safe/30",
  warn: "bg-warn/10 border-warn/30",
  danger: "bg-danger/10 border-danger/30",
};

function Report() {
  const { id } = Route.useParams();
  const scans = useScans();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const r = scans.find((s) => s.id === id);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-card" />;
  if (!r)
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <p className="font-display text-xl font-bold">Report not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted from your history.
        </p>
        <Link to="/scan" className="btn btn-primary mt-6">
          Start a new scan
        </Link>
      </div>
    );

  const tone = LEVEL_META[r.level].tone;
  const share = async () => {
    const text = `ScamShield AI check: "${r.label}" — ${LEVEL_META[r.level].label} (estimated ${r.score}/100). Always verify independently.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ScamShield AI report", text });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Report summary copied");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/history"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        History
      </Link>

      <section className={cn("relative overflow-hidden rounded-2xl border p-6", toneBg[tone])}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-foreground">
            {r.type === "url" ? (
              <Link2 className="size-3.5" />
            ) : (
              <MessageSquareText className="size-3.5" />
            )}
            {r.type === "url" ? "URL scan" : "Message scan"}
          </span>
          <span>{new Date(r.createdAt).toLocaleString()}</span>
          <span className="inline-flex items-center gap-1 text-safe">
            <CheckCircle2 className="size-3.5" />
            Analysis complete
          </span>
        </div>
        <p className="mt-3 break-all font-mono text-sm">
          {r.type === "url" ? r.input : `“${r.label}”`}
        </p>
        <div className="mt-4 flex flex-col items-center">
          <RiskGauge score={r.score} level={r.level} />
          <RiskBadge level={r.level} className="mt-4 px-4 py-1.5 text-sm" />
          <p className="mt-3 max-w-md text-center text-xs text-muted-foreground">
            The score reflects estimated risk based on available signals — not a guarantee that
            something is safe or unsafe.
          </p>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-primary" />
          Summary
        </h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">{r.summary}</p>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Eye className="size-5 text-primary" />
          Observed warning signs{" "}
          <span className="text-sm font-normal text-muted-foreground">({r.findings.length})</span>
        </h2>
        {r.findings.length === 0 ? (
          <div className="card-surface p-5 text-sm text-muted-foreground">
            No common scam indicators were found in this {r.type === "url" ? "link" : "message"}.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {r.findings.map((f) => {
              const t = f.weight >= 25 ? "danger" : f.weight >= 15 ? "warn" : "safe";
              return (
                <div key={f.id} className="card-surface flex gap-3 p-4">
                  <div
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-md",
                      toneBg[t === "safe" ? "warn" : t],
                      toneText[t === "safe" ? "warn" : t],
                    )}
                  >
                    <TriangleAlert className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-surface p-5">
        <h2 className="text-lg font-bold">Recommended actions</h2>
        <ul className="mt-3 space-y-2">
          {ACTIONS[r.level].map((a) => (
            <li key={a} className="flex items-start gap-3">
              <CheckCircle2 className={cn("mt-0.5 size-5 shrink-0", toneText[tone])} />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <HelpCircle className="size-5 text-muted-foreground" />
          Could not be verified
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {r.unverified.map((u) => (
            <li key={u}>• {u}</li>
          ))}
        </ul>
        <p className="mt-4 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          Automated analysis can produce false positives and false negatives. Report ID:{" "}
          <span className="font-mono text-foreground">{r.id}</span>
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link to="/scan" className="btn btn-primary col-span-2 md:col-span-1">
          <RotateCcw className="size-4" />
          Scan another
        </Link>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            try {
              await scanStore.update(r.id, { saved: !r.saved });
              toast.success(r.saved ? "Removed from saved" : "Report saved");
            } catch (cause) {
              toast.error(cause instanceof Error ? cause.message : "Could not update report.");
            }
          }}
        >
          {r.saved ? (
            <BookmarkCheck className="size-4 text-primary" />
          ) : (
            <Bookmark className="size-4" />
          )}
          {r.saved ? "Saved" : "Save"}
        </button>
        <button className="btn btn-ghost" onClick={share}>
          <Share2 className="size-4" />
          Share
        </button>
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost col-span-2 md:col-span-1"
        >
          <Flag className="size-4" />
          Report scam
        </a>
      </div>
    </div>
  );
}
