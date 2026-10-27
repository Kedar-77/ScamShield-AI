import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertOctagon,
  ClipboardPaste,
  Info,
  Link2,
  MessageSquareText,
  ScanSearch,
  X,
} from "lucide-react";
import { useState } from "react";
import { ScanningOverlay } from "@/components/scanning";
import { isValidUrl } from "@/lib/analyze";
import { useRunScan } from "@/lib/use-run-scan";
import { cn } from "@/lib/utils";

type Mode = "url" | "message";

export const Route = createFileRoute("/scan")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "message" ? "message" : s["mode"] === "url" ? "url" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Scam Scanner — ScamShield AI" },
      {
        name: "description",
        content:
          "Scan a suspicious URL or paste a message to check for phishing and fraud indicators.",
      },
      { property: "og:title", content: "Scam Scanner — ScamShield AI" },
      {
        property: "og:description",
        content: "Scan suspicious URLs and messages for scam warning signs.",
      },
    ],
  }),
  component: Scan,
});

const SAMPLES: Record<Mode, string[]> = {
  url: ["http://paypa1-secure-login.xyz/verify", "bit.ly/3xYz-free", "wikipedia.org"],
  message: [
    "URGENT: Dear customer, your SBI account will be blocked within 24h. Update KYC now at sbi-kyc-update.top and share the OTP sent to you.",
    "Congratulations! You've won a ₹50,000 Flipkart gift card. Pay a small processing fee via UPI to claim.",
    "Hi, are we still on for lunch tomorrow at 1?",
  ],
};
const MAX = 2000;

function Scan() {
  const { mode: initial } = Route.useSearch();
  const navigate = useNavigate({ from: "/scan" });
  const mode: Mode = initial ?? "url";
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const { status, error, run, reset } = useRunScan();
  const urlValid = isValidUrl(url);
  const msgValid = msg.trim().length >= 10;

  const setMode = (m: Mode) => {
    reset();
    navigate({ search: { mode: m } });
  };
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (mode === "url") setUrl(t);
      else setMsg(t.slice(0, MAX));
    } catch {
      /* blocked */
    }
  };

  const urlState = !url ? "empty" : urlValid ? "ready" : "invalid";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {status === "scanning" && <ScanningOverlay label={mode === "url" ? url : msg.slice(0, 60)} />}
      <div>
        <h1 className="text-3xl font-bold">Scam Scanner</h1>
        <p className="mt-1 text-muted-foreground">
          Paste what you received. We'll look for common fraud signals.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Scan type"
        className="grid grid-cols-2 gap-1 rounded-lg border bg-surface p-1"
      >
        {(
          [
            ["url", "URL", Link2],
            ["message", "Message", MessageSquareText],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-bold transition-all",
              mode === m
                ? "bg-card text-primary shadow-[var(--shadow-card)] ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <form
        className="card-surface space-y-4 p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "url" ? urlValid : msgValid) run(mode, mode === "url" ? url : msg);
        }}
      >
        {mode === "url" ? (
          <>
            <label htmlFor="url" className="text-sm font-semibold">
              Suspicious link
            </label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/…"
                aria-invalid={urlState === "invalid"}
                className={cn(
                  "field pl-12 pr-12",
                  urlState === "invalid" && "border-danger",
                  urlState === "ready" && "border-safe/60",
                )}
              />
              {url && (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => setUrl("")}
                  className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <p
              className={cn(
                "text-sm",
                urlState === "invalid"
                  ? "text-danger"
                  : urlState === "ready"
                    ? "text-safe"
                    : "text-muted-foreground",
              )}
            >
              {urlState === "empty" && "Enter or paste a link to begin."}
              {urlState === "invalid" && "Invalid URL — check for spaces or missing domain."}
              {urlState === "ready" && "✓ Ready to scan"}
            </p>
          </>
        ) : (
          <>
            <label htmlFor="msg" className="text-sm font-semibold">
              Suspicious message
            </label>
            <div className="relative">
              <textarea
                id="msg"
                value={msg}
                maxLength={MAX}
                onChange={(e) => setMsg(e.target.value)}
                rows={8}
                placeholder="Paste the suspicious SMS, email, or message here..."
                className="field resize-none py-3 leading-relaxed"
              />
              {msg && (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => setMsg("")}
                  className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{msg && !msgValid ? "Add a bit more text to analyze." : "\u00a0"}</span>
              <span className="tabular-nums">
                {msg.length}/{MAX}
              </span>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm">
            <AlertOctagon className="size-5 shrink-0 text-danger" />
            <div>
              <p className="font-semibold">Analysis failed</p>
              <p className="text-muted-foreground">
                {error || "Something went wrong. Please try again."}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={paste} className="btn btn-ghost">
            <ClipboardPaste className="size-5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <button
            type="submit"
            disabled={mode === "url" ? !urlValid : !msgValid}
            className="btn btn-primary flex-1"
          >
            <ScanSearch className="size-5" />
            {mode === "url" ? "Analyze link" : "Analyze message"}
          </button>
        </div>
      </form>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLES[mode].map((s) => (
            <button
              key={s}
              onClick={() => (mode === "url" ? setUrl(s) : setMsg(s))}
              className="max-w-full truncate rounded-full border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              {s.length > 50 ? s.slice(0, 50) + "…" : s}
            </button>
          ))}
        </div>
      </div>

      <p className="flex gap-2 rounded-md border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        Only submit information you are comfortable sharing. Remove passwords, verification codes,
        and sensitive personal information before scanning.
      </p>
    </div>
  );
}
