import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, History, Home, ScanSearch, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: ScanSearch },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const displayName =
    typeof user?.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : user?.email;
  const initials =
    displayName
      ?.split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "G";
  const active = (to: string) =>
    to === "/"
      ? path === "/"
      : path.startsWith(to) || (to === "/history" && path.startsWith("/report"));

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-surface p-5 md:flex">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                active(to)
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto card-surface p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">On-device checks</p>
          <p className="mt-1">
            Scans use pattern-based signals and run only when you ask. No background monitoring.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <Link to="/" className="md:hidden">
            <Logo />
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-xs font-semibold text-safe md:inline-flex">
            <span className="size-2 rounded-full bg-safe" /> Scanner ready
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Bell className="size-5" />
            </button>
            <Link
              to="/settings"
              aria-label="Profile"
              className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-brand-blue font-display text-sm font-bold text-primary-foreground"
            >
              {initials}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                active(to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active(to) && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" />}
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
