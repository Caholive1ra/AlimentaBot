import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useOperationalAuth } from "@/auth/AuthProvider";
import { clearConnectedSession, setConnectedSession } from "@/services/http";
import { getOperationalContext, type OperationalContext } from "@/services/operational-context";

export const Route = createFileRoute("/operacional")({ ssr: false, component: OperationalAccess });

const roleLabels: Record<string, string> = {
  doador: "Doador",
  transportador: "Transportador",
  instituicao: "Instituição",
  operador: "Operador",
  gestor: "Gestor",
  revisor_autorizado: "Revisor autorizado",
  admin_organizacao: "Administrador da organização",
  admin_plataforma: "Administrador da plataforma",
};

function OperationalAccess() {
  const auth = useOperationalAuth();
  const { configured, isLoading, isAuthenticated, user, login, logout, getAccessToken } = auth;
  const [context, setContext] = useState<OperationalContext>();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [error, setError] = useState<string>();
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => () => clearConnectedSession(), []);
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoadingContext(true);
    setError(undefined);
    void getAccessToken()
      .then((accessToken) =>
        getOperationalContext(accessToken).then((next) => ({ accessToken, next })),
      )
      .then(({ accessToken, next }) => {
        if (!active) return;
        setContext(next);
        if (next.organizations.length === 1) {
          const organization = next.organizations[0]!;
          setSelectedOrganizationId(organization.id);
          setConnectedSession({ accessToken, organizationId: organization.id });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Não foi possível carregar seu acesso.",
          );
        }
      })
      .finally(() => active && setLoadingContext(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated, getAccessToken]);

  async function connect(organizationId: string) {
    setError(undefined);
    if (!organizationId) {
      clearConnectedSession();
      setSelectedOrganizationId("");
      return;
    }
    try {
      setConnectedSession({ accessToken: await getAccessToken(), organizationId });
      setSelectedOrganizationId(organizationId);
    } catch {
      clearConnectedSession();
      setError("Sua sessão expirou. Entre novamente.");
    }
  }

  if (!configured) {
    return (
      <AccessMessage
        title="Ambiente operacional não configurado"
        detail="Esta instalação permanece no modo demonstração."
      />
    );
  }
  if (isLoading)
    return (
      <AccessMessage
        title="Verificando sessão…"
        detail="Aguarde enquanto validamos sua identidade."
      />
    );
  if (!isAuthenticated) {
    return (
      <AccessMessage
        title="Acesso operacional"
        detail="Entre com sua conta autorizada para continuar."
      >
        <button
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          onClick={() => void login()}
        >
          Entrar com Auth0
        </button>
      </AccessMessage>
    );
  }
  if (loadingContext)
    return (
      <AccessMessage
        title="Carregando organizações autorizadas…"
        detail="Consultando somente os vínculos aprovados para sua identidade."
      />
    );
  if (error) {
    return (
      <AccessMessage title="Não foi possível abrir o ambiente operacional" detail={error}>
        <button
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
        {error.includes("sessão") && (
          <button
            className="mt-3 block text-sm underline"
            onClick={() => void login("/operacional")}
          >
            Entrar novamente
          </button>
        )}
        <button className="mt-3 block text-sm underline" onClick={() => logout()}>
          Sair
        </button>
      </AccessMessage>
    );
  }
  if (!context) return null;
  if (!context.organizations.length) return <Onboarding context={context} logout={logout} />;
  const selected = context.organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );
  return (
    <AccessMessage
      title={`Olá, ${user?.name ?? user?.email ?? "usuário"}`}
      detail="As organizações e perfis abaixo foram obtidos do servidor. A seleção não substitui a autorização validada em cada chamada."
    >
      {context.organizations.length === 1 ? (
        <OrganizationCard organization={context.organizations[0]!} />
      ) : (
        <label className="block text-left text-sm font-medium" htmlFor="organization">
          <span>Escolha sua organização</span>
          <select
            id="organization"
            className="mt-1 w-full rounded-md border bg-background p-2"
            value={selectedOrganizationId}
            onChange={(event) => void connect(event.target.value)}
          >
            <option value="">Selecione uma organização</option>
            {context.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name} — {organization.roles.map(labelRole).join(", ")}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && context.organizations.length > 1 && <OrganizationCard organization={selected} />}
      {selected && (
        <p role="status" className="mt-4 rounded-md bg-success/10 p-3 text-sm text-success">
          Contexto operacional selecionado para {selected.name}.
        </p>
      )}
      <button className="mt-4 block text-sm underline" onClick={() => logout()}>
        Sair
      </button>
    </AccessMessage>
  );
}

function labelRole(role: string) {
  return roleLabels[role] ?? role;
}

function OrganizationCard({ organization }: { organization: { name: string; roles: string[] } }) {
  return (
    <div className="rounded-md border p-3 text-left">
      <p className="font-semibold">{organization.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Perfis autorizados: {organization.roles.map(labelRole).join(", ")}.
      </p>
    </div>
  );
}

function Onboarding({ context, logout }: { context: OperationalContext; logout: () => void }) {
  const states = {
    CADASTRO_PENDENTE: [
      "Cadastro em análise",
      `Solicitação para ${context.registration?.organization_name ?? "organização"} como ${labelRole(context.registration?.requested_role ?? "")} está pendente de aprovação.`,
    ],
    AGUARDANDO_CONVITE: [
      "Aguardando convite",
      "Existe um convite pendente para sua identidade. Aceite-o pelo canal seguro em que ele foi entregue.",
    ],
    ACESSO_REVOGADO: [
      "Acesso revogado",
      "Você não possui vínculo ativo com uma organização. Procure o administrador responsável.",
    ],
    SEM_ACESSO: [
      "Ainda não há acesso operacional",
      "Autenticar-se com Auth0 não concede permissões. Solicite cadastro ou aguarde um convite autorizado.",
    ],
    AUTORIZADO: ["Acesso autorizado", ""],
  } as const;
  const [title, detail] = states[context.onboarding];
  return (
    <AccessMessage title={title} detail={detail}>
      <Link
        className="inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
        to="/cadastro"
      >
        Solicitar cadastro
      </Link>
      <button className="mt-4 block text-sm underline" onClick={logout}>
        Sair
      </button>
    </AccessMessage>
  );
}

function AccessMessage({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{detail}</p>
      <div className="mt-6">{children}</div>
      <Link to="/" className="mt-6 text-sm underline">
        Voltar à página pública
      </Link>
    </main>
  );
}
