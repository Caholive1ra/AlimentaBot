import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, PackagePlus, Plus, Search, Store, Weight } from "lucide-react";
import { useDemo } from "@/hooks/use-demo";
import { CATEGORIA_LABEL, STATUS_LABEL, type StatusLote } from "@/lib/domain/models";
import { ConservacaoTag, Empty, MetricCard, PageHeader, Panel, StatusBadge } from "@/components/app/ui-kit";
import { LoteDetalhe } from "@/components/app/LoteDetalhe";
import { NovoLoteForm } from "@/components/app/NovoLoteForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtData, fmtKg, horasRestantes } from "@/lib/format";

export const Route = createFileRoute("/app/doador")({
  head: () => ({ meta: [{ title: "Doador — AlimentaBot (demo)" }] }),
  component: Doador,
});

function Doador() {
  const s = useDemo();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<string>("todos");
  const [cat, setCat] = useState<string>("todas");
  const [novo, setNovo] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const lista = useMemo(
    () => s.lotes.filter((l) =>
      (st === "todos" || l.status === st) && (cat === "todas" || l.categoria === cat) &&
      (`${l.id} ${l.item} ${l.origem}`.toLowerCase().includes(q.toLowerCase()))),
    [s.lotes, q, st, cat],
  );
  const kg = s.lotes.reduce((a, l) => a + l.quantidadeKg, 0);
  return (
    <>
      <PageHeader
        title="Painel do doador"
        desc="Publique excedentes seguros. Cada lote passa por revisão humana antes de ser oferecido."
        actions={<Button onClick={() => setNovo(true)}><Plus /> Cadastrar excedente</Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Store} label="Lotes publicados" value={s.lotes.length} />
        <MetricCard icon={Clock} label="Pendentes de revisão" value={s.lotes.filter((l) => l.status === "PENDENTE_REVISAO").length} tone="warning" />
        <MetricCard icon={PackagePlus} label="Entregues" value={s.lotes.filter((l) => l.status === "ENTREGUE").length} tone="success" />
        <MetricCard icon={Weight} label="Volume ofertado" value={fmtKg(kg)} tone="lime" />
      </div>

      <Panel className="mt-6" title="Meus lotes" desc="Dados fictícios — clique para ver detalhes e custódia.">
        <div className="mb-4 flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por item, código ou origem" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar lotes" />
          </div>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger className="md:w-52" aria-label="Filtrar status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABEL) as StatusLote[]).map((k) => <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="md:w-48" aria-label="Filtrar categoria"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {lista.length === 0 ? (
          <Empty icon={Search} title="Nenhum lote encontrado" desc="Ajuste os filtros ou cadastre um novo excedente." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead><TableHead>Categoria</TableHead><TableHead>Qtd.</TableHead>
                    <TableHead>Validade</TableHead><TableHead>Janela</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((l) => (
                    <TableRow key={l.id} className="cursor-pointer" onClick={() => setSel(l.id)}>
                      <TableCell>
                        <p className="font-medium">{l.item}</p>
                        <p className="font-mono text-xs text-muted-foreground">{l.id} · <ConservacaoTag c={l.conservacao} /></p>
                      </TableCell>
                      <TableCell>{CATEGORIA_LABEL[l.categoria]}</TableCell>
                      <TableCell>{fmtKg(l.quantidadeKg)}</TableCell>
                      <TableCell className="text-sm">{fmtData(l.validade)}<p className="text-xs text-muted-foreground">{horasRestantes(l.validade)}</p></TableCell>
                      <TableCell className="text-sm">{fmtData(l.janelaInicio)} – {fmtData(l.janelaFim).slice(-5)}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="grid gap-3 md:hidden">
              {lista.map((l) => (
                <li key={l.id}>
                  <button onClick={() => setSel(l.id)} className="w-full rounded-xl border p-4 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{l.item}</p>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{l.id} · {fmtKg(l.quantidadeKg)} · {horasRestantes(l.validade)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Cadastrar excedente</DialogTitle>
            <DialogDescription>Informe dados do lote fictício. Nada aqui é enviado a servidores.</DialogDescription>
          </DialogHeader>
          <NovoLoteForm onDone={() => setNovo(false)} />
        </DialogContent>
      </Dialog>
      <LoteDetalhe id={sel} onClose={() => setSel(null)} />
    </>
  );
}
