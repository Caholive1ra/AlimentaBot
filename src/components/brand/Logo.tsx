import { cn } from "@/lib/utils";

// Logo-conceito: robô simpático sobre um bowl de comida, com rota pontilhada.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect width="48" height="48" rx="14" className="fill-primary" />
      <path
        d="M6 40 C 14 34, 20 44, 30 38"
        className="stroke-accent"
        strokeWidth="1.8"
        strokeDasharray="2 2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="31" cy="38" r="2" className="fill-accent" />
      <line
        x1="24"
        y1="7"
        x2="24"
        y2="11"
        className="stroke-accent"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="6" r="2" className="fill-accent" />
      <rect x="14" y="11" width="20" height="13" rx="6" className="fill-background" />
      <circle cx="20" cy="17.5" r="2" className="fill-primary" />
      <circle cx="28" cy="17.5" r="2" className="fill-primary" />
      <path
        d="M21 21 q3 2 6 0"
        className="stroke-primary"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M10 26 h28 a14 9 0 0 1 -28 0 z" className="fill-accent" />
      <circle cx="18" cy="25" r="2.4" className="fill-success" />
      <circle cx="24" cy="24.2" r="2.6" className="fill-background" />
      <circle cx="30" cy="25" r="2.2" className="fill-success" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          tone === "light" ? "text-primary-foreground" : "text-primary",
        )}
      >
        Alimenta<span className="text-success">Bot</span>
      </span>
    </span>
  );
}
