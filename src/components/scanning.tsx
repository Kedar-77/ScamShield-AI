import { LogoMark } from "./brand";

export function ScanningOverlay({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative grid size-40 place-items-center">
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-pulse-ring" />
          <span className="absolute inset-4 rounded-full border border-primary/30 animate-pulse-ring [animation-delay:.5s]" />
          <div className="relative size-24 overflow-hidden rounded-3xl">
            <LogoMark className="size-24" />
            <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" />
          </div>
        </div>
        <p className="mt-6 font-display text-xl font-semibold">Analyzing for scam signals…</p>
        <p className="mt-2 max-w-xs truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
