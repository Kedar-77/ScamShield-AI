import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { sendPasswordReset, signIn, signOut, signUp } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ScamShield AI" },
      { name: "description", content: "Sign in or create your ScamShield AI account." },
    ],
  }),
  component: Login,
});

type Mode = "in" | "up" | "reset" | "confirm";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!isSupabaseConfigured)
        throw new Error("Set the Supabase environment values to enable accounts.");
      if (mode === "reset") {
        const { error: resetError } = await sendPasswordReset(email);
        if (resetError) throw resetError;
        toast.success("If that account exists, a reset link is on its way.");
        setMode("in");
      } else if (mode === "up") {
        if (name.trim().length < 2) throw new Error("Enter your name (at least 2 characters).");
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        const { data, error: signUpError } = await signUp(email, password, name);
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMode("confirm");
          return;
        }
        toast.success("Account created");
        navigate({ to: "/" });
      } else {
        if (!password) throw new Error("Enter your password.");
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        toast.success("Welcome back");
        navigate({ to: "/" });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    if (isSupabaseConfigured) {
      try {
        await signOut();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not sign out.");
        return;
      }
    }
    navigate({ to: "/" });
  };

  const heading =
    mode === "up"
      ? "Create your account"
      : mode === "reset"
        ? "Reset password"
        : mode === "confirm"
          ? "Check your email"
          : "Welcome back";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-center text-3xl font-bold">{heading}</h1>
        <p className="mt-2 text-center text-muted-foreground">
          {mode === "confirm"
            ? `We sent a confirmation link to ${email}. Confirm your email, then sign in.`
            : "Sign in to sync your scan reports across devices."}
        </p>
        {mode === "confirm" ? (
          <div className="card-surface mt-8 space-y-4 p-6">
            <button type="button" onClick={() => setMode("in")} className="btn btn-primary w-full">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="card-surface mt-8 space-y-4 p-6">
            {mode === "up" && (
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="name"
                  aria-label="Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field pl-12"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                aria-label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field pl-12"
                required
              />
            </div>
            {mode !== "reset" && (
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  aria-label="Password"
                  placeholder={mode === "up" ? "At least 8 characters" : "Password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field pl-12"
                  required
                  minLength={mode === "up" ? 8 : 1}
                />
              </div>
            )}
            {error && (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            {!isSupabaseConfigured && (
              <div className="rounded-md border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
                <p className="font-semibold">Account sign-in is not configured</p>
                <p className="mt-1">
                  Guest scanning still works. Connect Supabase to enable accounts and cloud-synced
                  reports.
                </p>
                <details className="mt-3 text-foreground">
                  <summary className="cursor-pointer font-semibold">Show setup steps</summary>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs text-muted-foreground">
                    <li>
                      Create a project in the{" "}
                      <a
                        className="underline"
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Supabase dashboard
                      </a>
                      .
                    </li>
                    <li>
                      Run{" "}
                      <code className="break-all rounded bg-secondary px-1">
                        supabase/migrations/20261028010000_create_scan_reports.sql
                      </code>{" "}
                      in its SQL Editor.
                    </li>
                    <li>
                      For local development, copy{" "}
                      <code className="rounded bg-secondary px-1">.env.example</code> to{" "}
                      <code className="rounded bg-secondary px-1">.env.local</code> and fill in both
                      values.
                    </li>
                    <li>
                      For Lovable or Cloudflare deployment, set{" "}
                      <code className="rounded bg-secondary px-1">VITE_SUPABASE_URL</code> and{" "}
                      <code className="rounded bg-secondary px-1">
                        VITE_SUPABASE_PUBLISHABLE_KEY
                      </code>{" "}
                      as build environment variables, then rebuild.
                    </li>
                  </ol>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use only the publishable key in frontend configuration. Never use a secret or
                    service-role key.
                  </p>
                </details>
              </div>
            )}
            <button disabled={busy || !isSupabaseConfigured} className="btn btn-primary w-full">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {mode === "in" ? "Log in" : mode === "up" ? "Sign up" : "Send reset link"}
            </button>
            {mode === "in" && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("reset");
                }}
                className="w-full text-sm font-semibold text-primary"
              >
                Forgot password?
              </button>
            )}
            <button type="button" onClick={guest} className="btn btn-ghost w-full">
              Continue as guest
            </button>
          </form>
        )}
        {mode !== "confirm" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "in" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError("");
              }}
              className="font-semibold text-primary"
            >
              {mode === "in" ? "Create an account" : "Log in"}
            </button>
          </p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Guest scans stay on this device. Signed-in scan reports are stored in your private
          account.
        </p>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground underline">
            Back to scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
