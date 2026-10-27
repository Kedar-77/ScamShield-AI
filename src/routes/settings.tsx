import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Info,
  LifeBuoy,
  LogOut,
  Moon,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand";
import { Confirm } from "@/components/confirm";
import { Switch } from "@/components/ui/switch";
import { signOut, updateDisplayName } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { preferencesStore, usePreferences } from "@/lib/preferences";
import { scanStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScamShield AI" },
      {
        name: "description",
        content: "Manage your account, preferences, privacy, and scan history.",
      },
    ],
  }),
  component: Settings,
});

function Row({
  icon,
  title,
  sub,
  right,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right ?? <ChevronRight className="size-5 text-muted-foreground" />}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="card-surface divide-y overflow-hidden">{children}</div>
    </section>
  );
}

function Settings() {
  const { user } = useAuth();
  const preferences = usePreferences();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(
    typeof user?.user_metadata.display_name === "string" ? user.user_metadata.display_name : "",
  );
  const [error, setError] = useState("");
  const displayName =
    (typeof user?.user_metadata.display_name === "string" && user.user_metadata.display_name) ||
    user?.email ||
    "Guest";
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "G";

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    try {
      await updateDisplayName(name);
      setEditing(false);
      setError("");
      toast.success("Profile updated");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your profile.");
    }
  };

  const clearHistory = async () => {
    try {
      await scanStore.clear();
      toast.success("Scan history cleared");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not clear scan history.");
    }
  };

  const logout = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate({ to: "/" });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not sign out.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="hero-surface p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-brand-blue font-display text-lg font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? "Guest account"}
            </p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={() => {
                setName(displayName);
                setEditing(!editing);
              }}
              className="btn btn-ghost min-h-10 text-sm"
            >
              {editing ? "Cancel" : "Edit name"}
            </button>
          ) : (
            <Link to="/login" className="btn btn-ghost min-h-10 text-sm">
              Sign in
            </Link>
          )}
        </div>
        {editing && (
          <form onSubmit={saveProfile} className="mt-5 space-y-3 border-t border-border pt-4">
            <label className="block space-y-1 text-sm font-semibold">
              Display name
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <button className="btn btn-primary w-full">Save profile</button>
          </form>
        )}
      </section>

      <Group title="Account and privacy">
        <Row
          icon={<UserRound className="size-5" />}
          title={user ? "Supabase account" : "Guest mode"}
          sub={
            user
              ? "Your account is managed securely by Supabase Auth"
              : "Guest scans stay in this browser"
          }
        />
        <Row
          icon={<Info className="size-5" />}
          title="Scan storage"
          sub={
            user
              ? "Signed-in scan reports sync to your private account"
              : "Scans are analyzed in your browser and saved on this device"
          }
        />
      </Group>
      <Group title="Preferences">
        <Row
          icon={<Bell className="size-5" />}
          title="Scan result notifications"
          sub="Show a confirmation when a scan completes"
          right={
            <Switch
              checked={preferences.notifications}
              onCheckedChange={preferencesStore.setNotifications}
              aria-label="Scan result notifications"
            />
          }
        />
        <Row
          icon={
            preferences.theme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />
          }
          title="Appearance"
          sub={preferences.theme === "dark" ? "Dark theme" : "Light theme"}
          right={
            <Switch
              checked={preferences.theme === "light"}
              onCheckedChange={(checked) => preferencesStore.setTheme(checked ? "light" : "dark")}
              aria-label="Light theme"
            />
          }
        />
      </Group>
      <Group title="Data">
        <Confirm
          trigger={
            <button type="button" className="w-full text-left">
              <Row
                icon={<Trash2 className="size-5" />}
                title="Clear scan history"
                sub={
                  user
                    ? "Delete cloud reports for this account"
                    : "Delete reports stored on this device"
                }
              />
            </button>
          }
          title="Clear all scan history?"
          description="Every report in this account will be permanently removed."
          action="Clear history"
          onConfirm={() => void clearHistory()}
        />
      </Group>
      <Group title="About and support">
        <Link to="/onboarding" className="block">
          <Row
            icon={<Info className="size-5" />}
            title="About ScamShield AI"
            sub="Version 1.0 · Pattern-based scam checks"
          />
        </Link>
        <a href="mailto:support@scamshield.ai?subject=ScamShield%20AI%20support" className="block">
          <Row
            icon={<LifeBuoy className="size-5" />}
            title="Help and support"
            sub="Contact support by email"
          />
        </a>
      </Group>
      {user ? (
        <button
          type="button"
          onClick={() => void logout()}
          className="btn btn-ghost w-full text-danger"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      ) : null}
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <LogoMark className="size-4 shrink-0" />
        ScamShield checks only what you submit. It does not monitor or block activity.
      </p>
    </div>
  );
}
