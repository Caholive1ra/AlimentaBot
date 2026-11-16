import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { clearConnectedSession, setConnectedSession } from "@/services/http";
import { useOperationalAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/operacional")({
  ssr: false,
  component: OperationalAccess,
});

function OperationalAccess() {
  const auth = useOperationalAuth();
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => () => clearConnectedSession(), []);

  if (!auth.configured) {
    return (
      <AccessMessage
        title="Ambiente operacional não configurado"
        detail="Esta instalação permanece no modo demonstração."
      />
    );
  }
  if (auth.isLoading)
    return (
      <AccessMessage
        title="Verificando sessão…"
        detail="Aguarde enquanto validamos sua identidade."
      />
    );
  if (!auth.isAuthenticated) {
    return (
      <AccessMessage
        title="Acesso operacional"
        detail="Entre com sua conta autorizada para continuar."
      >
        <button
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          onClick={() => void auth.login()}
        >
          Entrar com Auth0
        </button>
      </AccessMessage>
    );
  }

  async function connectApi() {
    setError(undefined);
    try {
      setConnectedSession({ accessToken: await auth.getAccessToken(), organizationId });
    } catch {
      clearConnectedSession();
      setError("Sua sessão expirou. Entre novamente para continuar.");
    }
  }

  return (
    <AccessMessage
      title={`Olá, ${auth.user?.name ?? auth.user?.email ?? "usuário"}`}
      detail="A organização é sempre validada pelo servidor; este valor não concede permissão por si só."
    >
      <label className="block text-left text-sm font-medium" htmlFor="organization-id">
        Organização autorizada
      </label>
      <input
        id="organization-id"
        value={organizationId}
        onChange={(event) => setOrganizationId(event.target.value)}
        placeholder="UUID da organização"
        className="mt-1 w-full rounded-md border p-2"
      />
      <button
        disabled={!organizationId}
        className="mt-3 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => void connectApi()}
      >
        Conectar à API
      </button>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <button className="mt-4 block text-sm underline" onClick={() => auth.logout()}>
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
