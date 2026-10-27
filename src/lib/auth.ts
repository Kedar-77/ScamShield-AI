import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export type AuthSnapshot = { user: User | null; loading: boolean };
const SERVER_SNAPSHOT: AuthSnapshot = { user: null, loading: true };
let snapshot: AuthSnapshot = { user: null, loading: Boolean(supabase) };
const listeners = new Set<() => void>();

function publish(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    publish({ user: session?.user ?? null, loading: false });
  });
  void supabase.auth.getSession().then(({ data, error }) => {
    if (error) console.error("Could not restore the Supabase session:", error.message);
    publish({ user: data.session?.user ?? null, loading: false });
  });
}

export function useAuth() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      isSupabaseConfigured
        ? "Authentication is unavailable in this rendering context."
        : "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return supabase;
}

export async function signUp(email: string, password: string, name: string) {
  const client = requireSupabase();
  return client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: name.trim() },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
}

export async function signIn(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  return requireSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(password: string) {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function updateDisplayName(name: string) {
  const { error } = await requireSupabase().auth.updateUser({
    data: { display_name: name.trim() },
  });
  if (error) throw error;
}
