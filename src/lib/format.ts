const dt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
export const fmtData = (iso?: string) => (iso ? dt.format(new Date(iso)) : "—");
export const fmtKg = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
export const fmtKm = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
export function horasRestantes(iso: string) {
  const h = (new Date(iso).getTime() - Date.now()) / 3600_000;
  if (h <= 0) return "vencido";
  if (h < 24) return `${Math.floor(h)}h restantes`;
  return `${Math.floor(h / 24)}d restantes`;
}
export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
