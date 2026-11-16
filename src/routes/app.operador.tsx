import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, Route as RouteIcon, ShieldAlert, Users } from "lucide-react";
import { useDemo } from "@/hooks/use-demo";
import { metricas } from "@/lib/domain/rules";
import { MetricCard, PageHeader, Panel } from "@/components/app/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/operador")({
  head: () => ({ meta: [{ title: "Operador — AlimentaBot (demonstração)" }] }),
  component: Operador,
});

function Operador() {
  const state = useDemo();
  const metrics = metricas(state);
  return (
    <>
      <PageHeader
        title="Painel do operador"
        desc="Fila e coordenação ilustrativas. Este perfil demonstrativo não possui conta, token, convite ou acesso ao sistema operacional."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Aguardando revisão"
          value={metrics.pendentes}
          tone="warning"
        />
        <MetricCard icon={RouteIcon} label="Em rota" value={metrics.emRota} tone="lime" />
        <MetricCard icon={Users} label="Instituições" value={state.instituicoes.length} />
        <MetricCard
          icon={ShieldAlert}
          label="Ocorrências"
          value={metrics.rejeitados}
          tone="warning"
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Roteiro da banca"
          desc="Use os painéis em ordem para acompanhar a jornada completa."
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Cadastre um excedente no painel do Doador.</li>
            <li>Registre a revisão hipotética no painel do Gestor.</li>
            <li>Reserve e confirme a coleta no painel do Transportador.</li>
            <li>Confirme o recebimento no painel da Instituição.</li>
          </ol>
          <Button asChild className="mt-5">
            <Link to="/app/doador">Iniciar roteiro</Link>
          </Button>
        </Panel>
        <Panel
          title="Limites do ambiente"
          desc="Separação deliberada entre demonstração e operação real."
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Nenhuma ação chama endpoint privilegiado do FastAPI.</li>
            <li>• Não há tokens Auth0 simulados nem conta administrativa compartilhada.</li>
            <li>• Reiniciar a demonstração remove somente os dados locais deste navegador.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
