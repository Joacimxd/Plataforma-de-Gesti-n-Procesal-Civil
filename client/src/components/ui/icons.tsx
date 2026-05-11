import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const base = (p: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.strokeWidth ?? 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: p.size ?? 16,
  height: p.size ?? 16,
  className: p.className,
});

// --- Navigation & UI ---
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="m15 18-6-6 6-6"/></svg>
);
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6"/></svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5"/></svg>
);
export const IconLoader = (p: IconProps) => (
  <svg {...base(p)} className={cn("animate-spin", p.className)}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconEyeOff = (p: IconProps) => (
  <svg {...base(p)}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
export const IconExternalLink = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
export const IconLogOut = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
);
export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

// --- Legal / Domain ---
export const IconScale = (p: IconProps) => (
  <svg {...base(p)}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
);
export const IconGavel = (p: IconProps) => (
  <svg {...base(p)}><path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>
);
export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);
export const IconFolderOpen = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
);
export const IconFileText = (p: IconProps) => (
  <svg {...base(p)}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
export const IconFilePlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
);
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
export const IconMessageSquare = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
export const IconRefreshCw = (p: IconProps) => (
  <svg {...base(p)}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);
export const IconAlertCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

// --- Stats ---
export const IconTrendingUp = (p: IconProps) => (
  <svg {...base(p)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
export const IconClipboardList = (p: IconProps) => (
  <svg {...base(p)}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);

// --- Role icons ---
export const IconJudge = (p: IconProps) => <IconGavel {...p} />;
export const IconPlaintiff = (p: IconProps) => <IconMessageSquare {...p} />;
export const IconDefense = (p: IconProps) => <IconShield {...p} />;

// --- Document type icons ---
export const IconDemand = (p: IconProps) => <IconFileText {...p} />;
export const IconResponse = (p: IconProps) => <IconFilePlus {...p} />;
export const IconMotion = (p: IconProps) => <IconClipboardList {...p} />;
export const IconEvidence = (p: IconProps) => <IconSearch {...p} />;
export const IconOrder = (p: IconProps) => <IconScale {...p} />;
export const IconSentence = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 5 12 1.774-5.226L21 14 9 9z"/><path d="m14.5 14.5 4.5 4.5"/></svg>
);

// --- Event type icons ---
export const IconEventCreated = (p: IconProps) => <IconFolderOpen {...p} />;
export const IconEventDocument = (p: IconProps) => <IconFilePlus {...p} />;
export const IconEventStatus = (p: IconProps) => <IconRefreshCw {...p} />;
export const IconEventHearing = (p: IconProps) => <IconCalendar {...p} />;
export const IconEventDefault = (p: IconProps) => <IconClock {...p} />;

// --- Status ---
export const IconCircleDot = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
);
