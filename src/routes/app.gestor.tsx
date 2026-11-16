import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, ClipboardCheck, History, Package, RotateCcw, Route as RouteIcon, Weight, X } from "lucide-react";
import { api, executar, useDemo } from "@/hooks/use-demo";
import { instituicaoCompativel, metricas, cargaInstituicao } from "@/lib/domain/rules";
import { CATEGORIA_LABEL, type Lote } from "@/lib/domain/models";
import { ConservacaoTag, Empty, MetricCard, PageHeader, Panel, StatusBadge } from "@/components/app/ui-kit";
import { LoteDetalhe } from "@/components/app/LoteDetalhe";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fmtData, fmtKg, fmtKm, horasRestantes } from "@/lib/format";

export const Route = createFileRoute("/app/gestor")({
  head: () => ({ meta: [{ title: "Gestor — AlimentaBot (demo)" }] }),
  component: Gestor,
});

const CHECKS = [
  "Validade e data de preparo coerentes",
  "Conservação declarada compatível com o item",
  "Embalagem e identificação informadas",
  "Janela de coleta anterior à validade",
];

function Revisao({ l }: { l: Lote }) {
  const s = useDemo();
  const [marcados, setMarcados] = useState<boolean[]>(CHECKS.map(() => false));
  const [inst, setInst] = useState("");
  const [motivo, setMotivo] = useState("");
  const [rejeitando, setRejeitando] = useState(false);
  const tudo = marcados.every(Boolean);
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{l.id} · {l.origem}</p>
          <p className="font-display font-semibold">{l.item}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span>{CATEGORIA_LABEL[l.categoria]}</span><span>{fmtKg(l.quantidadeKg)}</span>
            <ConservacaoTag c={l.conservacao} /><span>Validade {fmtData(l.validade)} ({horasRestantes(l.validade)})</span>
          </p>
        </div>
        <StatusBadge status={l.status} />
      </div>
      <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist hipotético (sem valor sanitário real)</legend>
        {CHECKS.map((c, i) => (
          <label key={c} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
            <Checkbox checked={!!marcados[i]} onCheckedChange={(v) => setMarcados((m) => m.map((x, j) => (j === i ? v === true : x)))} />
            {c}
          </label>
        ))}
      </fieldset>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div>
          <Label>Destino sugerido (instituição fictícia)</Label>
          <Select value={inst} onValueChange={setInst}>
            <SelectTrigger aria-label="Instituição de destino"><SelectValue placeholder="Selecione a instituição" /></SelectTrigger>
            <SelectContent>
              {s.instituicoes.map((i) => {
                const m = instituicaoCompativel(s, i, l);
                return (
                  <SelectItem key={i.id} value={i.id} disabled={!!m}>
                    {i.nome} — {m ?? `${fmtKg(i.capacidadeKg - cargaInstituicao(s, i.id))} livres`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Button variant="success" disabled={!tudo || !inst} onClick={() => executar(() => api.aprovarLote(l.id, inst), `${l.id} liberado para retirada.`)}>
          <Check /> Aprovar (teste)
        </Button>
        <Button variant="outline" onClick={() => setRejeitando((v) => !v)}><X /> Rejeitar</Button>
      </div>
      {rejeitando && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da rejeição (simulação)" aria-label="Motivo da rejeição" />
          <Button variant="destructive" onClick={() => executar(() => api.rejeitarLote(l.id, motivo), `${l.id} rejeitado.`)}>Confirmar rejeição</Button>
        </div>
      )}
    </div>
  );
}

function Gestor() {
  const s = useDemo();
  const m = metricas(s);
  const [sel, setSel] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("todos");
  const pendentes = s.lotes.filter((l) => l.status === "PENDENTE_REVISAO");
  const eventos = s.eventos.filter((e) => filtro === "todos" || e.loteId === filtro);
  return (
    <>
      <PageHeader
        title="Gestor / Operador"
        desc="Revisão sanitária puramente hipotética para simulação. Não substitui avaliação técnica nem gera atestado."
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline"><RotateCcw /> Reiniciar demonstração</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reiniciar demonstração?</AlertDialogTitle>
                <AlertDialogDescription>Todos os lotes, eventos e notificações deste navegador voltam ao estado inicial sintético.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => executar(() => api.reiniciar(), "Demonstração reiniciada.")}>Reiniciar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={ClipboardCheck} label="Fila de revisão" value={m.pendentes} tone="warning" />
        <MetricCard icon={Package} label="Liberados" value={m.liberados} tone="lime" />
        <MetricCard icon={RouteIcon} label="Em rota" value={m.emRota} hint={`${fmtKm(m.kmHipoteticos)} hipotéticos entregues`} />
        <MetricCard icon={Weight} label="Recebido (demo)" value={fmtKg(m.kgEntregues)} tone="success" hint={`${m.rejeitados} rejeitados/recusados`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Fila de revisão humana" desc="Nenhum lote é liberado automaticamente.">
          {pendentes.length ? <div className="space-y-4">{pendentes.map((l) => <Revisao key={l.id} l={l} />)}</div>
            : <Empty icon={ClipboardCheck} title="Fila vazia" desc="Cadastre um lote no painel do doador para testar a revisão." />}
        </Panel>
        <div className="space-y-6">
          <Panel title="Capacidade das instituições">
            <ul className="space-y-4">
              {s.instituicoes.map((i) => {
                const c = cargaInstituicao(s, i.id);
                return (
                  <li key={i.id}>
                    <div className="flex justify-between text-sm"><span className="font-medium">{i.nome}</span><span className="text-muted-foreground">{fmtKg(c)} / {fmtKg(i.capacidadeKg)}</span></div>
                    <Progress value={(c / i.capacidadeKg) * 100} className="mt-1.5 h-2" />
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Notificações">
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {s.notificacoes.slice(0, 10).map((n) => (
                <li key={n.id} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><span>{n.texto}<span className="block text-xs text-muted-foreground">{fmtData(n.ts)}</span></span></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel className="mt-6" title="Ciclo dos lotes">
        <Table>
          <TableHeader><TableRow><TableHead>Lote</TableHead><TableHead>Destino</TableHead><TableHead>Transportador</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {s.lotes.map((l) => (
              <TableRow key={l.id} className="cursor-pointer" onClick={() => setSel(l.id)}>
                <TableCell><span className="font-mono text-xs text-muted-foreground">{l.id}</span> <span className="font-medium">{l.item}</span></TableCell>
                <TableCell className="text-sm">{s.instituicoes.find((i) => i.id === l.instituicaoId)?.nome ?? "—"}</TableCell>
                <TableCell className="text-sm">{s.transportadores.find((t) => t.id === l.transportadorId)?.nome ?? "—"}</TableCell>
                <TableCell><StatusBadge status={l.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel className="mt-6" title="Histórico de custódia (fictício, auditável)" actions={
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-44" aria-label="Filtrar por lote"><History /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os lotes</SelectItem>
            {s.lotes.map((l) => <SelectItem key={l.id} value={l.id}>{l.id}</SelectItem>)}
          </SelectContent>
        </Select>
      }>
        <Table>
          <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Evento</TableHead><TableHead>Lote</TableHead><TableHead>Ator</TableHead><TableHead>Detalhe</TableHead></TableRow></TableHeader>
          <TableBody>
            {eventos.slice(0, 40).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs">{fmtData(e.ts)}</TableCell>
                <TableCell className="text-sm">{e.acao}</TableCell>
                <TableCell className="font-mono text-xs">{e.loteId}</TableCell>
                <TableCell className="text-sm capitalize">{e.ator}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.detalhe ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <LoteDetalhe id={sel} onClose={() => setSel(null)} />
    </>
  );
}
