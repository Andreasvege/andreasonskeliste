import type { Category } from "@/lib/wishes";

type P = { size?: number; color?: string };

const stroke = (color: string, width: number) => ({
  fill: "none",
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function CategoryIcon({ icon }: { icon: Category["icon"] }) {
  const s = { width: 28, height: 28, viewBox: "0 0 24 24", ...stroke("#13294B", 1.8) };
  switch (icon) {
    case "run":
      return (
        <svg {...s}>
          <path d="M2 17h14l5 2v2H2z" />
          <path d="M4 17l2-9 4 2 2 4 4 1" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...s}>
          <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
          <path d="M16 10h2a3 3 0 0 1 0 6h-2" />
          <path d="M8 3v2M12 3v2" />
        </svg>
      );
    case "tech":
      return (
        <svg {...s}>
          <rect x="7" y="3" width="10" height="18" rx="5" />
          <path d="M12 7v4" />
        </svg>
      );
    case "music":
      return (
        <svg {...s}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      );
    case "travel":
      return (
        <svg {...s}>
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M9 7V4h6v3M9 20v1M15 20v1" />
        </svg>
      );
  }
}

export function ArrowRight({ size = 20, color = "#13294B" }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke(color, 2)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ size = 20, color = "#A3211A" }: P) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke(color, 2)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...stroke("#13294B", 2)}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="#FFC53D" stroke="#A3211A" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" {...stroke("#34496B", 2)}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 .3 6 2.3 6 5.5" />
    </svg>
  );
}

export function TagIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" {...stroke("#13294B", 2.2)}>
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  );
}

export function ExternalIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" {...stroke("currentColor", 2.2)}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

export function CheckIcon({ size = 16, color = "#1F7A45", width = 2.6 }: P & { width?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke(color, width)} style={{ flex: "none" }}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}
