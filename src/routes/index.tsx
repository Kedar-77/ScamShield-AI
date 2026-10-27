import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  ClipboardPaste,
  Gift,
  Link2,
  Mail,
  MessageSquareText,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { RiskBadge } from "@/components/brand";
import { ScanningOverlay } from "@/components/scanning";
import { isValidUrl } from "@/lib/analyze";
import { useScans } from "@/lib/store";
import { useRunScan } from "@/lib/use-run-scan";
import heroShield from "@/assets/hero-shield.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScamShield AI — Check before you click" },
      {
        name: "description",
        content:
          "Scan suspicious links and messages for phishing and scam warning signs in seconds.",
      },
      { property: "og:title", content: "ScamShield AI — Check before you click" },
      {
        property: "og:description",
        content: "Scan suspicious links and messages for phishing and scam warning signs.",
      },
    ],
  }),
  component: Home,
});

const QUICK = [
  { icon: Link2, title: "Check a URL", desc: "Inspect link structure", mode: "url" },
  { icon: MessageSquareText, title: "Analyze an SMS", desc: "Spot fraud wording", mode: "message" },
  { icon: Mail, title: "Inspect an email", desc: "Paste the email body", mode: "message" },
  { icon: Gift, title: "Verify an offer", desc: "Too good to be true?", mode: "message" },
] as const;

function Home() {
  const scans = useScans();
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const { status, run } = useRunScan();
  const valid = isValidUrl(url);
  const high = scans.filter((s) => s.level === "high").length;

  const paste = async () => {
    try {
      setUrl(await navigator.clipboard.readText());
      setTouched(true);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-8">
      {status === "scanning" && <ScanningOverlay label={url} />}
      <section className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Stay protected today</h1>
          <p className="mt-1 text-muted-foreground">
            Check suspicious links and messages before you trust them.
          </p>
        </div>
      </section>

      <section className="hero-surface relative overflow-hidden p-6 md:p-8">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <img
          src={heroShield}
          alt=""
          width={1024}
          height={1024}
          className="pointer-events-none absolute -right-10 -top-6 w-48 opacity-80 md:right-4 md:top-1/2 md:w-72 md:-translate-y-1/2"
        />
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Scam check
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            Check before
            <br />
            you <span className="text-gradient">click.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Scan a suspicious link or message to identify potential scam indicators.
          </p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setTouched(true);
              if (valid) run("url", url);
            }}
          >
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Suspicious URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Paste a link, e.g. paypa1-secure.xyz/login"
                className="field pl-12 pr-24"
                aria-invalid={touched && !!url && !valid}
              />
              <button
                type="button"
                onClick={paste}
                className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-sm bg-secondary px-3 text-xs font-bold hover:bg-accent"
              >
                <ClipboardPaste className="size-4" />
                Paste
              </button>
            </div>
            {touched && url && !valid && (
              <p className="text-sm text-danger">
                That doesn't look like a valid link. Check for typos or spaces.
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={!valid} className="btn btn-primary flex-1">
                <ScanSearch className="size-5" />
                Analyze for scams
              </button>
              <Link to="/scan" search={{ mode: "message" }} className="btn btn-ghost">
                <MessageSquareText className="size-5" />
                Scan a message
              </Link>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK.map(({ icon: Icon, title, desc, mode }) => (
            <Link
              key={title}
              to="/scan"
              search={{ mode }}
              className="card-surface group p-4 transition-colors hover:border-primary/50"
            >
              <div className="grid size-10 place-items-center rounded-md bg-gradient-to-br from-primary/20 to-brand-blue/20 text-primary">
                <Icon className="size-5" />
              </div>
              <p className="mt-3 font-bold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Scans completed" value={scans.length} />
        <Stat label="High-risk findings" value={high} tone="danger" />
        <Stat label="Saved reports" value={scans.filter((s) => s.saved).length} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h3>
          {scans.length > 0 && (
            <Link to="/history" className="text-sm font-semibold text-primary">
              View all
            </Link>
          )}
        </div>
        {scans.length === 0 ? (
          <div className="card-surface flex flex-col items-center p-8 text-center">
            <ShieldAlert className="size-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">No scans yet</p>
            <p className="text-sm text-muted-foreground">Your first result will appear here.</p>
          </div>
        ) : (
          <ul className="card-surface divide-y overflow-hidden">
            {scans.slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link
                  to="/report/$id"
                  params={{ id: s.id }}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/50"
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${s.level === "high" ? "bg-danger" : s.level === "caution" ? "bg-warn" : "bg-safe"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <RiskBadge level={s.level} className="hidden sm:inline-flex" />
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="card-surface p-4">
      <p
        className={`font-display text-3xl font-bold tabular-nums ${tone === "danger" && value > 0 ? "text-danger" : ""}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
