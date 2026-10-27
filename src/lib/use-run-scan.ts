import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { analyze, type ScanType } from "./analyze";
import { preferencesStore } from "./preferences";
import { scanStore } from "./store";

export function useRunScan() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [error, setError] = useState("");
  const run = (type: ScanType, input: string) => {
    setError("");
    setStatus("scanning");
    setTimeout(async () => {
      try {
        const r = analyze(type, input);
        await scanStore.add(r);
        if (preferencesStore.get().notifications)
          toast.success("Scan complete", { description: "Your report is ready to review." });
        navigate({ to: "/report/$id", params: { id: r.id } });
      } catch (cause) {
        setStatus("error");
        const message =
          cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
        setError(message);
        toast.error("Could not complete scan", { description: message });
      }
    }, 1600);
  };
  return {
    status,
    error,
    run,
    reset: () => {
      setError("");
      setStatus("idle");
    },
  };
}
