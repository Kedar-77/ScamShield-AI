import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { LEVEL_META, type RiskLevel } from "@/lib/analyze";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ssg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--brand-blue)" />
        </linearGradient>
      </defs>
      <path d="M24 3 41 9v13c0 11-7.4 19.4-17 23C14.4 41.4 7 33 7 22V9l17-6Z" fill="url(#ssg)" />
      <path
        d="M24 7.5 37 12v10c0 8.6-5.6 15.4-13 18.5C16.6 37.4 11 30.6 11 22V12l13-4.5Z"
        fill="var(--background)"
        opacity=".9"
      />
      <g stroke="var(--primary)" strokeWidth="1.2" opacity=".5" fill="none">
        <path d="M15 17h4l2 2M33 17h-4l-2 2M15 29h3M33 29h-3" />
        <circle cx="15" cy="17" r="1" fill="var(--primary)" />
        <circle cx="33" cy="17" r="1" fill="var(--primary)" />
      </g>
      <path
        d="m17.5 24 4.5 4.5 9-9"
        stroke="url(#ssg)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-9" />
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          ScamShield <span className="text-gradient">AI</span>
        </span>
      )}
    </span>
  );
}

const toneCls = {
  safe: "bg-safe/12 text-safe border-safe/30",
  warn: "bg-warn/12 text-warn border-warn/30",
  danger: "bg-danger/12 text-danger border-danger/30",
};
const toneIcon = { safe: ShieldCheck, warn: AlertTriangle, danger: ShieldAlert };

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const m = LEVEL_META[level];
  const Icon = toneIcon[m.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        toneCls[m.tone],
        className,
      )}
    >
      <Icon className="size-3.5" />
      {m.label}
    </span>
  );
}

export function RiskGauge({
  score,
  level,
  size = 220,
}: {
  score: number;
  level: RiskLevel;
  size?: number;
}) {
  const tone = LEVEL_META[level].tone;
  const color = `var(--${tone})`;
  const r = 80;
  const c = Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div
      className="relative"
      style={{ width: size, height: size * 0.62 }}
      role="img"
      aria-label={`Estimated risk score ${score} out of 100, ${LEVEL_META[level].label}`}
    >
      <svg viewBox="0 0 200 120" className="w-full">
        <defs>
          <linearGradient id="gauge-track" x1="0" x2="1">
            <stop offset="0" stopColor="var(--safe)" stopOpacity=".25" />
            <stop offset=".5" stopColor="var(--warn)" stopOpacity=".25" />
            <stop offset="1" stopColor="var(--danger)" stopOpacity=".25" />
          </linearGradient>
        </defs>
        <path
          d="M20 105a80 80 0 0 1 160 0"
          stroke="url(#gauge-track)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M20 105a80 80 0 0 1 160 0"
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)",
            filter: `drop-shadow(0 0 8px color-mix(in oklab, ${color} 60%, transparent))`,
          }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-display text-5xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">estimated risk / 100</span>
      </div>
    </div>
  );
}
