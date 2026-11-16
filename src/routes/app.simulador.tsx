import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  Gauge,
  ShieldCheck,
  Snowflake,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/app/ui-kit";

export const Route = createFileRoute("/app/simulador")({
  head: () => ({ meta: [{ title: "Simulador de matching — AlimentaBot (demo)" }] }),
  component: Simulador,
});

const base = { entregas: 14, kg: 79, km: 48.08 };
const otim = { entregas: 15, kg: 98, km: 41.43 };
const dados = [
  { m: "Entregas", Sequencial: base.entregas, Otimizado: otim.entregas },
  { m: "Kg destinados", Sequencial: base.kg, Otimizado: otim.kg },
  { m: "Km de desvio", Sequencial: base.km, Otimizado: otim.km },
];
const pct = (a: number, b: number) =>
  `${b > a ? "+" : ""}${(((b - a) / a) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const bloqueios = [
  { i: CalendarClock, t: "Validade", d: "Lote só entra se a coleta terminar antes do vencimento." },
  {
    i: Snowflake,
    t: "Conservação",
    d: "Refrigerado/congelado exige veículo e destino compatíveis.",
  },
  { i: Gauge, t: "Capacidade", d: "Peso cabe no veículo e no espaço livre da instituição." },
  { i: CalendarClock, t: "Janela", d: "Coleta e recebimento precisam se sobrepor no tempo." },
  { i: UserCheck, t: "Revisão humana", d: "Sem aprovação do operador, nenhum lote é sugerido." },
];

function Simulador() {
  return (
    <>
      <PageHeader
        title="Simulador de matching"
        desc="Como o AlimentaBot sugere combinações lote → transportador → destino, e uma comparação de pesquisa simulada."
      />
      <div
        role="note"
        className="mb-6 flex gap-3 rounded-2xl border border-warning/50 bg-warning/12 p-4 text-sm text-warning-foreground"
      >
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>
          <strong>Números acadêmicos sintéticos.</strong> Cenário simulado com 24 lotes, 16
          motoristas e 8 destinos fictícios. Não é resultado operacional, não houve teste de campo e
          não representa execução de IA real.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Entregas", `${base.entregas} → ${otim.entregas}`, pct(base.entregas, otim.entregas)],
          ["Kg destinados", `${base.kg} → ${otim.kg} kg`, pct(base.kg, otim.kg)],
          [
            "Desvio total",
            `${base.km.toLocaleString("pt-BR")} → ${otim.km.toLocaleString("pt-BR")} km`,
            pct(base.km, otim.km),
          ],
        ].map(([k, v, p]) => (
          <div key={k} className="rounded-2xl border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-1 font-display text-xl font-bold">{v}</p>
            <p className="mt-1 inline-block rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success">
              {p} (simulado)
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Baseline sequencial × otimização (simulação)">
          <div className="h-80" aria-label="Gráfico comparativo">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Legend />
                <Bar dataKey="Sequencial" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Otimizado" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="lg:col-span-2" title="Como o matching funciona">
          <ol className="space-y-3 text-sm">
            <li>
              <strong>1. Filtragem.</strong> Remove combinações que violam algum bloqueio.
            </li>
            <li>
              <strong>2. Pontuação.</strong> Prioriza menor desvio hipotético e maior volume
              aproveitado.
            </li>
            <li>
              <strong>3. Alocação.</strong> Baseline atende lotes na ordem de chegada; a otimização
              avalia o conjunto todo.
            </li>
            <li>
              <strong>4. Sugestão.</strong> O resultado é apenas uma sugestão — pessoas aceitam ou
              recusam.
            </li>
          </ol>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Bloqueios aplicados antes de qualquer sugestão"
        desc="Os mesmos bloqueios operam no fluxo demonstrativo da plataforma."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {bloqueios.map((b) => (
            <div key={b.t} className="rounded-xl bg-muted/60 p-4">
              <b.i className="h-5 w-5 text-success" />
              <p className="mt-2 font-semibold">{b.t}</p>
              <p className="text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Nenhum algoritmo libera alimento sozinho: a revisão
          humana é obrigatória.
        </p>
      </Panel>
    </>
  );
}
