export type ScanType = "url" | "message";
export type RiskLevel = "low" | "caution" | "high";
export type Finding = { id: string; title: string; detail: string; weight: number };

export type ScanReport = {
  id: string;
  type: ScanType;
  input: string;
  label: string;
  createdAt: number;
  score: number;
  level: RiskLevel;
  summary: string;
  findings: Finding[];
  unverified: string[];
  saved: boolean;
};

const SUSPICIOUS_TLDS = [
  "xyz",
  "top",
  "click",
  "zip",
  "mov",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "buzz",
  "rest",
  "icu",
  "loan",
  "work",
];
const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "ow.ly",
];
const BRANDS = [
  "paypal",
  "amazon",
  "google",
  "apple",
  "microsoft",
  "netflix",
  "sbi",
  "hdfc",
  "icici",
  "paytm",
  "phonepe",
  "flipkart",
  "whatsapp",
  "instagram",
  "facebook",
];
const LOOKALIKE: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "@": "a",
  rn: "m",
  vv: "w",
};

export function isValidUrl(raw: string): boolean {
  const v = raw.trim();
  if (!v || v.length > 10_000 || /\s/.test(v)) return false;
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v : `https://${v}`);
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      /\./.test(u.hostname) &&
      u.hostname.length > 3
    );
  } catch {
    return false;
  }
}

function normalizeLookalike(s: string) {
  let out = s;
  for (const [k, v] of Object.entries(LOOKALIKE)) out = out.split(k).join(v);
  return out;
}

export function levelFor(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "caution";
  return "low";
}

function analyzeUrl(raw: string): Finding[] {
  const v = raw.trim();
  const hasScheme = /^[a-z]+:\/\//i.test(v);
  const u = new URL(hasScheme ? v : `https://${v}`);
  const host = u.hostname.toLowerCase();
  const f: Finding[] = [];
  if (hasScheme && u.protocol === "http:")
    f.push({
      id: "http",
      title: "Unencrypted connection",
      detail: "The link uses http:// instead of https://, so data sent to it is not encrypted.",
      weight: 15,
    });
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
    f.push({
      id: "ip",
      title: "Raw IP address instead of a domain",
      detail: `The link points to ${host}. Legitimate services rarely ask you to visit a bare IP address.`,
      weight: 30,
    });
  const tld = host.split(".").pop() ?? "";
  if (SUSPICIOUS_TLDS.includes(tld))
    f.push({
      id: "tld",
      title: "Frequently abused domain ending",
      detail: `The ".${tld}" ending is cheap to register and commonly seen in scam campaigns.`,
      weight: 20,
    });
  if (SHORTENERS.includes(host))
    f.push({
      id: "short",
      title: "Shortened link hides the destination",
      detail:
        "Link shorteners conceal where you'll actually land. The final destination could not be checked.",
      weight: 15,
    });
  const parts = host.split(".");
  if (parts.length >= 5)
    f.push({
      id: "subs",
      title: "Unusually deep subdomain structure",
      detail: "Many nested subdomains can be used to make a fake site look official.",
      weight: 15,
    });
  if (v.includes("@") && hasScheme)
    f.push({
      id: "at",
      title: 'Hidden destination using "@"',
      detail: 'Text before an "@" in a URL is ignored by browsers and can disguise the real site.',
      weight: 25,
    });
  if ((host.match(/-/g) ?? []).length >= 2)
    f.push({
      id: "hyph",
      title: "Multiple hyphens in domain",
      detail: "Domains like secure-login-account-verify are a common phishing pattern.",
      weight: 10,
    });
  if (host.startsWith("xn--") || host.includes(".xn--"))
    f.push({
      id: "puny",
      title: "Internationalized (punycode) domain",
      detail: "Punycode can render letters that look identical to familiar brand names.",
      weight: 25,
    });
  const norm = normalizeLookalike(host);
  const registrable = parts.slice(-2).join(".");
  for (const b of BRANDS) {
    const inHost = host.includes(b);
    const officialish = registrable.startsWith(`${b}.`);
    if (!inHost && norm.includes(b)) {
      f.push({
        id: "spoof",
        title: "Misleading domain spelling",
        detail: `The domain looks similar to "${b}" but uses swapped characters.`,
        weight: 35,
      });
      break;
    }
    if (inHost && !officialish) {
      f.push({
        id: "brand",
        title: "Brand name outside the main domain",
        detail: `"${b}" appears in the link, but the actual domain is ${registrable}.`,
        weight: 25,
      });
      break;
    }
  }
  const path = (u.pathname + u.search).toLowerCase();
  if (
    /(login|verify|account|update|secure|confirm|kyc|wallet|unlock)/.test(path + host) &&
    f.length > 0
  )
    f.push({
      id: "kw",
      title: "Credential-related keywords",
      detail:
        "The link contains words like login, verify, or KYC, often used to collect passwords.",
      weight: 10,
    });
  if (v.length > 120)
    f.push({
      id: "long",
      title: "Very long URL",
      detail: "Excessively long links can hide suspicious parameters or redirect chains.",
      weight: 8,
    });
  if (/(redirect|url=|next=|goto=)/.test(path))
    f.push({
      id: "redir",
      title: "Suspicious redirect pattern",
      detail: "The link includes a parameter that may forward you to another site.",
      weight: 12,
    });
  return f;
}

function analyzeMessage(text: string): Finding[] {
  const t = text.toLowerCase();
  const f: Finding[] = [];
  if (
    /(urgent|immediately|within 24 ?h|last chance|suspended|blocked|expire|act now|final notice|legal action)/.test(
      t,
    )
  )
    f.push({
      id: "urgent",
      title: "Urgent or threatening language",
      detail:
        "The message pressures you to act quickly — a classic tactic to stop you from thinking it through.",
      weight: 25,
    });
  if (/(otp|one[- ]time|password|pin\b|cvv|verification code)/.test(t))
    f.push({
      id: "otp",
      title: "Requests passwords or OTPs",
      detail: "Banks and real services never ask you to share OTPs, PINs, or passwords.",
      weight: 35,
    });
  if (/(gift card|upi|transfer|pay (a )?fee|processing fee|bitcoin|crypto|wire|refund)/.test(t))
    f.push({
      id: "pay",
      title: "Unusual payment request",
      detail: "Asking for fees, gift cards, crypto, or UPI transfers is a strong scam signal.",
      weight: 25,
    });
  if (/(won|winner|lottery|prize|reward|cashback|free|congratulations|selected)/.test(t))
    f.push({
      id: "prize",
      title: "Too-good-to-be-true offer",
      detail: "Unexpected prizes or rewards are commonly used as bait.",
      weight: 18,
    });
  if (
    /(kyc|account (will be )?(blocked|suspended)|update your (details|account)|verify your)/.test(t)
  )
    f.push({
      id: "kyc",
      title: "Account verification pretext",
      detail: "Fake KYC or account-verification requests are used to steal credentials.",
      weight: 20,
    });
  if (/(dear customer|dear user|valued customer)/.test(t))
    f.push({
      id: "generic",
      title: "Unverified sender identity",
      detail: "A generic greeting suggests the sender doesn't actually know who you are.",
      weight: 10,
    });
  const urls = (text.match(/(https?:\/\/\S+|\b[\w-]+\.(?:[a-z]{2,})(?:\/\S*)?)/gi) ?? [])
    .map((url) => url.replace(/[),.!?;:]+$/, ""))
    .filter(isValidUrl);
  const linkFindings = urls.flatMap((url) => analyzeUrl(url));
  if (urls.length)
    f.push({
      id: "link",
      title: "Contains a link",
      detail: `The message includes ${urls.length === 1 ? "a link" : `${urls.length} links`}. Avoid tapping until the sender is verified.`,
      weight: 8,
    });
  const seen = new Set(f.map((x) => x.id));
  for (const lf of linkFindings)
    if (!seen.has(lf.id)) {
      seen.add(lf.id);
      f.push({ ...lf, title: `Link: ${lf.title}` });
    }
  return f;
}

export function analyze(type: ScanType, input: string): ScanReport {
  const findings = type === "url" ? analyzeUrl(input) : analyzeMessage(input);
  const score = Math.min(
    97,
    Math.max(4, Math.round(findings.reduce((s, x) => s + x.weight, 0) + (findings.length ? 0 : 6))),
  );
  const level = levelFor(score);
  const label =
    type === "url"
      ? (() => {
          try {
            return new URL(
              /^[a-z]+:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`,
            ).hostname;
          } catch {
            return input.slice(0, 40);
          }
        })()
      : input.trim().replace(/\s+/g, " ").slice(0, 48) + (input.trim().length > 48 ? "…" : "");
  const top = findings
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((x) => x.title.toLowerCase());
  const summary =
    level === "high"
      ? `This ${type === "url" ? "link" : "message"} shows several strong scam indicators, including ${top.join(" and ")}. Treat it as likely fraudulent until independently verified.`
      : level === "caution"
        ? `Some warning signs were found, such as ${top.join(" and ")}. It may be legitimate, but verify the source before sharing anything.`
        : `No major warning signs were detected in the ${type === "url" ? "link structure" : "text"}. That isn't a guarantee of safety — stay alert.`;
  const unverified =
    type === "url"
      ? [
          "Domain registration age and ownership",
          "Live page content and final redirect destination",
          "Reputation in external threat databases",
        ]
      : [
          "The true identity of the sender",
          "Whether linked websites are live or malicious",
          "Phone numbers or account details mentioned",
        ];
  const createdAt = Date.now();
  const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
  return {
    id: `SS-${createdAt.toString(36).toUpperCase()}-${suffix}`,
    type,
    input,
    label,
    createdAt,
    score,
    level,
    summary,
    findings,
    unverified,
    saved: false,
  };
}

export const LEVEL_META: Record<RiskLevel, { label: string; tone: "safe" | "warn" | "danger" }> = {
  low: { label: "Low risk", tone: "safe" },
  caution: { label: "Needs caution", tone: "warn" },
  high: { label: "High risk", tone: "danger" },
};

export const ACTIONS: Record<RiskLevel, string[]> = {
  high: [
    "Avoid opening the link",
    "Do not share passwords or OTPs",
    "Verify the sender independently",
    "Report it through the official channel (e.g. cybercrime.gov.in or your bank)",
  ],
  caution: [
    "Verify the domain carefully",
    "Check the sender through a known contact",
    "Avoid entering sensitive information until verified",
  ],
  low: [
    "No major warning signs were detected",
    "Automated checks cannot guarantee safety — still verify before paying or logging in",
  ],
};
