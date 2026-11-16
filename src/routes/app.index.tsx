import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  HandHeart,
  Package,
  Route as RouteIcon,
  ShieldCheck,
  Store,
  Truck,
  Weight,
} from "lucide-react";
import { useDemo } from "@/hooks/use-demo";
import { metricas } from "@/lib/domain/rules";
import { MetricCard, PageHeader, Panel, StatusBadge } from "@/components/app/ui-kit";
import { fmtData, fmtKg } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Visão geral — AlimentaBot (demo)" }] }),
  component: Overview,
});

const papeis = [
  { to: "/app/doador", t: "Doador", d: "Publica excedentes seguros", icon: Store },
  { to: "/app/gestor", t: "Gestor / Operador", d: "Revisa e libera lotes", icon: ShieldCheck },
  { to: "/app/transportador", t: "Transportador", d: "Aceita e coleta entregas", icon: Truck },
  {
    to: "/app/instituicao",
    t: "Instituição",
    d: "Confere e confirma recebimento",
    icon: HandHeart,
  },
] as const;

function Overview() {
  const s = useDemo();
  const m = metricas(s);
  const criados = s.eventos.filter(
    (e) => e.acao.startsWith("Lote publicado") && !["LT-1001", "LT-1002"].includes(e.loteId),
  );
  const meusIds = new Set(criados.map((e) => e.loteId));
  const meus = s.lotes.filter((l) => meusIds.has(l.id));
  const tem = (st: string[]) => meus.some((l) => st.includes(l.status));
  const passos = [
    { t: "Cadastre um lote como Doador", ok: meus.length > 0, to: "/app/doador" },
    {
      t: "Aprove-o (revisão hipotética) como Gestor",
      ok: tem(["LIBERADO", "RESERVADO", "COLETADO", "ENTREGUE"]),
      to: "/app/gestor",
    },
    {
      t: "Aceite e registre a coleta como Transportador",
      ok: tem(["COLETADO", "ENTREGUE"]),
      to: "/app/transportador",
    },
    { t: "Confirme o recebimento como Instituição", ok: tem(["ENTREGUE"]), to: "/app/instituicao" },
  ] as const;
  return (
    <>
      <PageHeader
        title="Visão geral"
        desc="Indicadores ilustrativos calculados a partir do estado demonstrativo deste navegador."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Aguardando revisão"
          value={m.pendentes}
          tone="warning"
          hint="Revisão humana obrigatória"
        />
        <MetricCard icon={Package} label="Liberados" value={m.liberados} tone="lime" />
        <MetricCard
          icon={RouteIcon}
          label="Em rota"
          value={m.emRota}
          hint="Reservados + coletados"
        />
        <MetricCard
          icon={Weight}
          label="Recebidos (demo)"
          value={fmtKg(m.kgEntregues)}
          tone="success"
          hint={`${m.entregues} entregas sintéticas`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3 overflow-hidden"
          title="Experimente em 3 minutos"
          desc="Fluxo ponta a ponta neste navegador. O progresso atualiza sozinho."
        >
          <ol className="space-y-2">
            {passos.map((p, i) => (
              <li key={p.t}>
                <Link
                  to={p.to}
                  className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60"
                >
                  {p.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className={p.ok ? "text-muted-foreground line-through" : "font-medium"}>
                    {p.t}
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="lg:col-span-2" title="Atividade recente">
          <ul className="space-y-3">
            {s.eventos.slice(0, 6).map((e) => (
              <li key={e.id} className="text-sm">
                <p>
                  <span className="font-mono text-xs text-muted-foreground">{e.loteId}</span>{" "}
                  {e.acao}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtData(e.ts)} · {e.ator}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Entrar como</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {papeis.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="group rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-accent">
              <p.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display font-semibold">{p.t}</p>
            <p className="text-sm text-muted-foreground">{p.d}</p>
          </Link>
        ))}
      </div>

      <Panel
        className="mt-6"
        title="Últimos lotes"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/doador">Ver todos</Link>
          </Button>
        }
      >
        <ul className="divide-y">
          {s.lotes.slice(0, 5).map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <span>
                <span className="font-mono text-xs text-muted-foreground">{l.id}</span>{" "}
                <span className="font-medium">{l.item}</span>
              </span>
              <StatusBadge status={l.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
