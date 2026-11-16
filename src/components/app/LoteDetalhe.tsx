import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useDemo } from "@/hooks/use-demo";
import { CATEGORIA_LABEL, CONSERVACAO_LABEL } from "@/lib/domain/models";
import { fmtData, fmtKg, fmtKm, horasRestantes } from "@/lib/format";
import { StatusBadge } from "./ui-kit";

export function LoteDetalhe({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useDemo();
  const l = s.lotes.find((x) => x.id === id);
  const inst = s.instituicoes.find((i) => i.id === l?.instituicaoId);
  const tr = s.transportadores.find((t) => t.id === l?.transportadorId);
  const eventos = s.eventos.filter((e) => e.loteId === id);
  return (
    <Sheet open={!!l} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {l && (
          <>
            <SheetHeader>
              <p className="font-mono text-xs text-muted-foreground">{l.id}</p>
              <SheetTitle className="font-display text-xl">{l.item}</SheetTitle>
              <SheetDescription asChild>
                <div>
                  <StatusBadge status={l.status} />
                </div>
              </SheetDescription>
            </SheetHeader>
            <dl className="mt-4 grid grid-cols-2 gap-3 px-4 text-sm">
              {[
                ["Categoria", CATEGORIA_LABEL[l.categoria]],
                [
                  "Quantidade",
                  `${fmtKg(l.quantidadeKg)}${l.unidades ? ` · ${l.unidades} un.` : ""}`,
                ],
                ["Conservação", CONSERVACAO_LABEL[l.conservacao]],
                ["Validade", `${fmtData(l.validade)} (${horasRestantes(l.validade)})`],
                ["Preparo", fmtData(l.preparadoEm)],
                ["Janela de coleta", `${fmtData(l.janelaInicio)} – ${fmtData(l.janelaFim)}`],
                ["Origem (fictícia)", l.origem],
                ["Distância hipotética", fmtKm(l.distanciaKm)],
                ["Destino", inst?.nome ?? "A definir na revisão"],
                ["Transportador", tr?.nome ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {(l.observacoes || l.motivo) && (
              <div className="mx-4 mt-3 rounded-xl border p-3 text-sm">
                {l.observacoes && (
                  <p>
                    <span className="text-muted-foreground">Observações: </span>
                    {l.observacoes}
                  </p>
                )}
                {l.motivo && (
                  <p className="text-destructive">
                    <span className="font-medium">Motivo: </span>
                    {l.motivo}
                  </p>
                )}
              </div>
            )}
            <div className="px-4 pb-6">
              <h3 className="mb-3 mt-6 text-sm font-semibold">Histórico de custódia (fictício)</h3>
              <ol className="relative space-y-4 border-l-2 border-border pl-5">
                {eventos.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card bg-success" />
                    <p className="text-sm font-medium">{e.acao}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtData(e.ts)} · {e.ator}
                      {e.detalhe ? ` · ${e.detalhe}` : ""}
                    </p>
                  </li>
                ))}
                {!eventos.length && <li className="text-sm text-muted-foreground">Sem eventos.</li>}
              </ol>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
