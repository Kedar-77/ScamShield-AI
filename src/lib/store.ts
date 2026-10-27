import { useSyncExternalStore } from "react";
import type { ScanReport } from "./analyze";
import { supabase } from "./supabase";

const KEY = "scamshield.scans";
const TABLE = "scan_reports";
const EMPTY: ScanReport[] = [];
type ScanRow = {
  id: string;
  user_id: string;
  type: ScanReport["type"];
  input: string;
  label: string;
  created_at: string;
  score: number;
  level: ScanReport["level"];
  summary: string;
  findings: ScanReport["findings"];
  unverified: string[];
  saved: boolean;
};

let cache: ScanReport[] | null = null;
let activeUserId: string | null = null;
let loadVersion = 0;
const listeners = new Set<() => void>();

function readLocal(): ScanReport[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as ScanReport[]) : [];
  } catch {
    return [];
  }
}

function read(): ScanReport[] {
  if (cache) return cache;
  cache = readLocal();
  return cache;
}

function publish(next: ScanReport[]) {
  cache = next;
  if (!activeUserId) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Keep guest scans available in memory if browser storage is unavailable.
    }
  }
  listeners.forEach((listener) => listener());
}

function toRow(
  report: ScanReport,
  userId: string,
): Omit<ScanRow, "created_at"> & { created_at: string } {
  return {
    id: report.id,
    user_id: userId,
    type: report.type,
    input: report.input,
    label: report.label,
    created_at: new Date(report.createdAt).toISOString(),
    score: report.score,
    level: report.level,
    summary: report.summary,
    findings: report.findings,
    unverified: report.unverified,
    saved: report.saved,
  };
}

function fromRow(row: ScanRow): ScanReport {
  return {
    id: row.id,
    type: row.type,
    input: row.input,
    label: row.label,
    createdAt: new Date(row.created_at).getTime(),
    score: row.score,
    level: row.level,
    summary: row.summary,
    findings: row.findings,
    unverified: row.unverified,
    saved: row.saved,
  };
}

async function requireCloud() {
  if (!supabase || !activeUserId) throw new Error("Sign in to sync reports to your account.");
  return { client: supabase, userId: activeUserId };
}

export const scanStore = {
  async setUser(userId: string | null) {
    activeUserId = userId;
    const version = ++loadVersion;
    cache = userId ? [] : readLocal();
    listeners.forEach((listener) => listener());
    if (!userId || !supabase) return;

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (version !== loadVersion || activeUserId !== userId) return;
    if (error) throw error;
    publish(((data ?? []) as ScanRow[]).map(fromRow));
  },
  async add(report: ScanReport) {
    if (activeUserId) {
      const { client, userId } = await requireCloud();
      const { error } = await client.from(TABLE).insert(toRow(report, userId));
      if (error) throw error;
    }
    publish([report, ...read()]);
  },
  async update(id: string, patch: Partial<ScanReport>) {
    const report = read().find((item) => item.id === id);
    if (!report) return;
    if (activeUserId) {
      const { client, userId } = await requireCloud();
      const next = { ...report, ...patch };
      const { error } = await client
        .from(TABLE)
        .update({ saved: next.saved })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    }
    publish(read().map((item) => (item.id === id ? { ...item, ...patch } : item)));
  },
  async remove(id: string) {
    if (activeUserId) {
      const { client, userId } = await requireCloud();
      const { error } = await client.from(TABLE).delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    }
    publish(read().filter((item) => item.id !== id));
  },
  async clear() {
    if (activeUserId) {
      const { client, userId } = await requireCloud();
      const { error } = await client.from(TABLE).delete().eq("user_id", userId);
      if (error) throw error;
    }
    publish([]);
  },
  get(id: string) {
    return read().find((item) => item.id === id);
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY && !activeUserId) {
      cache = null;
      listeners.forEach((subscriber) => subscriber());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useScans(): ScanReport[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
