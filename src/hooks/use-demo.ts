import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { getState, subscribe } from "@/services/store";
import { api } from "@/services/api";

export function useDemo() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export async function executar(acao: () => Promise<unknown>, sucesso: string) {
  try {
    await acao();
    toast.success(sucesso);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
    return false;
  }
}

export { api };
