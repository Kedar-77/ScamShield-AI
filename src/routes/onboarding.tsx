import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lightbulb, Link2, MessageSquareWarning } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — ScamShield AI" },
      {
        name: "description",
        content: "Learn how ScamShield AI helps you spot suspicious links and messages.",
      },
      { property: "og:title", content: "Welcome — ScamShield AI" },
      {
        property: "og:description",
        content: "Spot suspicious links and messages before you trust them.",
      },
    ],
  }),
  component: Onboarding,
});

const STEPS = [
  {
    icon: Link2,
    title: "Spot suspicious links",
    body: "Understand potential warning signs before opening a link.",
  },
  {
    icon: MessageSquareWarning,
    title: "Analyze suspicious messages",
    body: "Check messages for common fraud indicators.",
  },
  {
    icon: Lightbulb,
    title: "Make informed decisions",
    body: "Get explanations and practical safety recommendations.",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const S = STEPS[i]!;
  const last = i === STEPS.length - 1;
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-6 py-8">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative flex items-center justify-between">
        <Logo />
        <Link to="/login" className="text-sm font-semibold text-muted-foreground">
          Skip
        </Link>
      </div>
      <div className="relative mx-auto flex max-w-sm flex-1 flex-col items-center justify-center text-center">
        <div key={i} className="animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto grid size-48 place-items-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 to-brand-blue/20 blur-2xl" />
            <div className="hero-surface relative grid size-36 place-items-center rounded-[2.5rem]">
              <S.icon className="size-16 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="mt-10 text-3xl font-bold">{S.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{S.body}</p>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-sm space-y-6">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, k) => (
            <span
              key={k}
              className={cn(
                "h-2 rounded-full transition-all",
                k === i ? "w-8 bg-primary" : "w-2 bg-border",
              )}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? nav({ to: "/login" }) : setI(i + 1))}
          className="btn btn-primary w-full"
        >
          {last ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}
