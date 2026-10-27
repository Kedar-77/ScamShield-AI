import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { updatePassword } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password — ScamShield AI" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success("Password updated");
      navigate({ to: "/" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-center text-3xl font-bold">Choose a new password</h1>
        <form onSubmit={submit} className="card-surface mt-8 space-y-4 p-6">
          <input
            type="password"
            autoComplete="new-password"
            aria-label="New password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
            minLength={8}
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            aria-label="Confirm password"
            placeholder="Confirm new password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="field"
            minLength={8}
            required
          />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn btn-primary w-full">
            Update password
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-muted-foreground underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
