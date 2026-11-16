import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, PackageCheck, Snowflake, Truck, Weight } from "lucide-react";
import { api, executar, useDemo } from "@/hooks/use-demo";
import { transportadorCompativel } from "@/lib/domain/rules";
import { ConservacaoTag, Empty, MetricCard, PageHeader, Panel, StatusBadge } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtData, fmtKg, fmtKm, horasRestantes } from "@/lib/format";

export const Route = createFileRoute("/app/transportador")({
  head: () => ({ meta: [{ title: "Transportador — AlimentaBot (demo)" }] }),
  component: Transportador,
});

function Transportador() {
  const s = useDemo();
  const [tid, setTid] = useState("TR-01");
  const t = s.transportadores.find((x) => x.id === tid)!;
  const ofertas = s.lotes.filter((l) => l.status === "LIBERADO").sort((a, b) => a.distanciaKm - b.distanciaKm);
  const minhas = s.lotes.filter((l) => l.transportadorId === tid && ["RESERVADO", "COLETADO"].includes(l.status));
  const feitas = s.lotes.filter((l) => l.transportadorId === tid && l.status === "ENTREGUE");
  const inst = (id?: string) => s.instituicoes.find((i) => i.id === id);
  return (
    <>
      <PageHeader
        title="Transportador"
        desc="Oportunidades liberadas após revisão humana. Distâncias são hipotéticas — não há GPS real."
        actions={
          <Select value={tid} onValueChange={setTid}>
            <SelectTrigger className="w-64" aria-label="Perfil de transportador"><SelectValue /></SelectTrigger>
            <SelectContent>{s.transportadores.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome} · {x.veiculo}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Truck} label="Veículo" value={<span className="text-lg">{t.veiculo}</span>} />
        <MetricCard icon={Weight} label="Capacidade" value={fmtKg(t.capacidadeKg)} tone="lime" />
        <MetricCard icon={Snowflake} label="Refrigeração" value={t.refrigerado ? "Sim" : "Não"} />
        <MetricCard icon={PackageCheck} label="Entregas concluídas" value={feitas.length} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Oportunidades disponíveis" desc="Ordenadas pela menor distância hipotética.">
          {ofertas.length ? (
            <ul className="space-y-3">
              {ofertas.map((l) => {
                const bloqueio = transportadorCompativel(t, l);
                return (
                  <li key={l.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{l.item}</p>
                        <p className="font-mono text-xs text-muted-foreground">{l.id}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary"><MapPin className="h-3.5 w-3.5" />{fmtKm(l.distanciaKm)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{fmtKg(l.quantidadeKg)}</span><ConservacaoTag c={l.conservacao} />
                      <span>Janela {fmtData(l.janelaInicio)}–{fmtData(l.janelaFim).slice(-5)}</span>
                      <span>Para: {inst(l.instituicaoId)?.nome}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {bloqueio ? <p className="text-xs font-medium text-destructive">Bloqueado: {bloqueio}</p> : <p className="text-xs text-success">Compatível com seu veículo</p>}
                      <Button size="sm" disabled={!!bloqueio} onClick={() => executar(() => api.reservarLote(l.id, tid), `Entrega ${l.id} aceita.`)}>Aceitar entrega</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <Empty icon={Truck} title="Nenhuma oportunidade liberada" desc="Aguarde o gestor aprovar lotes na fila de revisão." />}
        </Panel>

        <Panel title="Minhas entregas" desc="Registre a coleta na ordem correta.">
          {minhas.length ? (
            <ul className="space-y-3">
              {minhas.map((l) => (
                <li key={l.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{l.item}</p><StatusBadge status={l.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{l.id} · {fmtKg(l.quantidadeKg)} · validade {horasRestantes(l.validade)} · destino {inst(l.instituicaoId)?.nome}</p>
                  <div className="mt-3 flex justify-end">
                    {l.status === "RESERVADO" ? (
                      <Button size="sm" variant="success" onClick={() => executar(() => api.coletarLote(l.id, tid), `Coleta de ${l.id} registrada.`)}>Registrar coleta</Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Em trânsito — aguardando conferência da instituição.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty icon={PackageCheck} title="Sem entregas em andamento" />}
        </Panel>
      </div>
    </>
  );
}
