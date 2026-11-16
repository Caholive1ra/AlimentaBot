import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIA_LABEL, CONSERVACAO_LABEL, type NovoLoteInput } from "@/lib/domain/models";
import { validarNovoLote, type ErrosLote } from "@/lib/domain/rules";
import { api, executar } from "@/hooks/use-demo";
import { toLocalInput } from "@/lib/format";

function inicial(): NovoLoteInput {
  const n = Date.now();
  const d = (h: number) => toLocalInput(new Date(n + h * 3600_000));
  return { item: "", categoria: "", quantidadeKg: 0, conservacao: "", preparadoEm: d(-1), validade: d(24), janelaInicio: d(1), janelaFim: d(5), origem: "", observacoes: "" };
}

export function NovoLoteForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<NovoLoteInput>(inicial);
  const [erros, setErros] = useState<ErrosLote>({});
  const set = <K extends keyof NovoLoteInput>(k: K, v: NovoLoteInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const err = (k: keyof NovoLoteInput) => erros[k] && <p className="mt-1 text-xs text-destructive" role="alert">{erros[k]}</p>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validarNovoLote(f, new Date());
    setErros(v);
    if (Object.keys(v).length) return;
    const ok = await executar(() => api.criarLote(f), "Lote enviado. Status: pendente de revisão humana.");
    if (ok) onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="item">Item</Label>
        <Input id="item" value={f.item} onChange={(e) => set("item", e.target.value)} placeholder="Ex.: Pães integrais do dia" />
        {err("item")}
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={f.categoria} onValueChange={(v) => set("categoria", v as NovoLoteInput["categoria"])}>
          <SelectTrigger aria-label="Categoria"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{Object.entries(CATEGORIA_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        {err("categoria")}
      </div>
      <div>
        <Label>Conservação</Label>
        <Select value={f.conservacao} onValueChange={(v) => set("conservacao", v as NovoLoteInput["conservacao"])}>
          <SelectTrigger aria-label="Conservação"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{Object.entries(CONSERVACAO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        {err("conservacao")}
      </div>
      <div>
        <Label htmlFor="kg">Peso (kg)</Label>
        <Input id="kg" type="number" min={0} step="0.1" value={f.quantidadeKg || ""} onChange={(e) => set("quantidadeKg", Number(e.target.value))} />
        {err("quantidadeKg")}
      </div>
      <div>
        <Label htmlFor="un">Unidades (opcional)</Label>
        <Input id="un" type="number" min={0} value={f.unidades ?? ""} onChange={(e) => set("unidades", e.target.value === "" ? undefined : Number(e.target.value))} />
        {err("unidades")}
      </div>
      <div>
        <Label htmlFor="prep">Preparo / recebimento</Label>
        <Input id="prep" type="datetime-local" value={f.preparadoEm} onChange={(e) => set("preparadoEm", e.target.value)} />
        {err("preparadoEm")}
      </div>
      <div>
        <Label htmlFor="val">Validade</Label>
        <Input id="val" type="datetime-local" value={f.validade} onChange={(e) => set("validade", e.target.value)} />
        {err("validade")}
      </div>
      <div>
        <Label htmlFor="ji">Janela segura — início</Label>
        <Input id="ji" type="datetime-local" value={f.janelaInicio} onChange={(e) => set("janelaInicio", e.target.value)} />
        {err("janelaInicio")}
      </div>
      <div>
        <Label htmlFor="jf">Janela segura — fim</Label>
        <Input id="jf" type="datetime-local" value={f.janelaFim} onChange={(e) => set("janelaFim", e.target.value)} />
        {err("janelaFim")}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="orig">Origem (fictícia)</Label>
        <Input id="orig" value={f.origem} onChange={(e) => set("origem", e.target.value)} placeholder="Ex.: Mercado Fictício Centro" />
        {err("origem")}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="obs">Observações</Label>
        <Textarea id="obs" value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Alergênicos, embalagem, instruções de retirada…" />
      </div>
      <p className="rounded-xl bg-warning/12 p-3 text-xs text-warning-foreground sm:col-span-2">
        Todo lote novo entra como <strong>PENDENTE DE REVISÃO</strong> e só fica visível a transportadores após revisão humana (simulada).
      </p>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit">Enviar para revisão</Button>
      </div>
    </form>
  );
}
