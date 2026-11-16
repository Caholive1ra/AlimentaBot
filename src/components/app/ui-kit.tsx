import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Snowflake, Thermometer, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conservacao, StatusLote } from "@/lib/domain/models";
import { STATUS_LABEL } from "@/lib/domain/models";

const statusStyle: Record<StatusLote, string> = {
  PENDENTE_REVISAO: "bg-warning/15 text-warning-foreground border-warning/40",
  LIBERADO: "bg-accent/25 text-accent-foreground border-accent/60",
  RESERVADO: "bg-info/10 text-info border-info/30",
  COLETADO: "bg-primary/10 text-primary border-primary/25",
  ENTREGUE: "bg-success/12 text-success border-success/30",
  REJEITADO: "bg-destructive/10 text-destructive border-destructive/30",
  RECUSADO: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: StatusLote }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyle[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const consIcon: Record<Conservacao, LucideIcon> = {
  ambiente: Sun,
  refrigerado: Thermometer,
  congelado: Snowflake,
};
const consTxt: Record<Conservacao, string> = {
  ambiente: "Ambiente",
  refrigerado: "Refrigerado",
  congelado: "Congelado",
};
export function ConservacaoTag({ c }: { c: Conservacao }) {
  const I = consIcon[c];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <I className="h-3.5 w-3.5" /> {consTxt[c]}
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "lime" | "success" | "warning";
}) {
  const tones = {
    default: "bg-secondary text-primary",
    lime: "bg-accent/30 text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  desc,
  actions,
  children,
  className,
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-soft", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-medium">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}

export function DemoChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/50 bg-warning/15 px-3 py-1 text-[11px] font-bold tracking-wide text-warning-foreground",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
      DEMONSTRAÇÃO • DADOS SINTÉTICOS
    </span>
  );
}
