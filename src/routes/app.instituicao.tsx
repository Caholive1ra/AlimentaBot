import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, HandHeart, Inbox, PackageCheck, Weight } from "lucide-react";
import { api, executar, useDemo } from "@/hooks/use-demo";
import { cargaInstituicao } from "@/lib/domain/rules";
import type { Lote } from "@/lib/domain/models";
import {
  ConservacaoTag,
  Empty,
  MetricCard,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtData, fmtKg, horasRestantes } from "@/lib/format";

export const Route = createFileRoute("/app/instituicao")({
  head: () => ({ meta: [{ title: "Instituição — AlimentaBot (demo)" }] }),
  component: Instituicao,
});

const CONF = ["Temperatura/conservação adequada", "Embalagem íntegra", "Quantidade confere"];

function Conferencia({ l }: { l: Lote }) {
  const [ok, setOk] = useState(CONF.map(() => false));
  const [motivo, setMotivo] = useState("");
  const [recusa, setRecusa] = useState(false);
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{l.item}</p>
        <StatusBadge status={l.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {l.id} · {fmtKg(l.quantidadeKg)} · validade {horasRestantes(l.validade)}
      </p>
      <div className="mt-3 grid gap-2">
        {CONF.map((c, i) => (
          <label key={c} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!ok[i]}
              onCheckedChange={(v) => setOk((o) => o.map((x, j) => (j === i ? v === true : x)))}
            />{" "}
            {c}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setRecusa((v) => !v)}>
          Recusar
        </Button>
        <Button
          size="sm"
          variant="success"
          disabled={!ok.every(Boolean)}
          onClick={() =>
            executar(() => api.confirmarRecebimento(l.id), `Recebimento de ${l.id} confirmado.`)
          }
        >
          Confirmar recebimento
        </Button>
      </div>
      {recusa && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da recusa"
            aria-label="Motivo da recusa"
          />
          <Button
            variant="destructive"
            onClick={() =>
              executar(() => api.recusarRecebimento(l.id, motivo), `${l.id} recusado.`)
            }
          >
            Confirmar recusa
          </Button>
        </div>
      )}
    </div>
  );
}

function Instituicao() {
  const s = useDemo();
  const [iid, setIid] = useState("IN-01");
  const i = s.instituicoes.find((x) => x.id === iid)!;
  const lotes = s.lotes.filter((l) => l.instituicaoId === iid);
  const chegando = lotes.filter((l) => l.status === "COLETADO");
  const previstos = lotes.filter((l) => ["LIBERADO", "RESERVADO"].includes(l.status));
  const hist = lotes.filter((l) => ["ENTREGUE", "RECUSADO"].includes(l.status));
  const recebido = hist
    .filter((l) => l.status === "ENTREGUE")
    .reduce((a, l) => a + l.quantidadeKg, 0);
  return (
    <>
      <PageHeader
        title="Instituição receptora"
        desc="Lotes destinados à sua instituição fictícia. Alterações aparecem em todos os painéis."
        actions={
          <Select value={iid} onValueChange={setIid}>
            <SelectTrigger className="w-64" aria-label="Instituição">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {s.instituicoes.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={HandHeart}
          label="Capacidade comprometida"
          value={`${fmtKg(cargaInstituicao(s, iid))}`}
          hint={`de ${fmtKg(i.capacidadeKg)}`}
        />
        <MetricCard
          icon={CalendarClock}
          label="Janela de recebimento"
          value={i.janela}
          tone="lime"
        />
        <MetricCard
          icon={Inbox}
          label="A caminho"
          value={chegando.length + previstos.length}
          tone="warning"
        />
        <MetricCard icon={Weight} label="Recebido (demo)" value={fmtKg(recebido)} tone="success" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Aguardando conferência" desc="Lotes coletados e em trânsito.">
          {chegando.length ? (
            <div className="space-y-3">
              {chegando.map((l) => (
                <Conferencia key={l.id} l={l} />
              ))}
            </div>
          ) : (
            <Empty icon={PackageCheck} title="Nada para conferir agora" />
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Previstos">
            {previstos.length ? (
              <ul className="divide-y">
                {previstos.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span>
                      <span className="font-medium">{l.item}</span>
                      <span className="block text-xs text-muted-foreground">
                        {l.id} · {fmtKg(l.quantidadeKg)} · <ConservacaoTag c={l.conservacao} />
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum lote previsto.</p>
            )}
          </Panel>
          <Panel title="Histórico de recebimentos">
            {hist.length ? (
              <ul className="divide-y">
                {hist.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <span>
                      {l.item}
                      <span className="block text-xs text-muted-foreground">
                        {l.id} · {fmtData(l.janelaFim)}
                      </span>
                    </span>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem histórico.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
