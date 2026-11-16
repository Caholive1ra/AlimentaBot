import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useOperationalAuth } from "@/auth/AuthProvider";
import {
  submitPublicRegistration,
  type PublicRegistrationRole,
} from "@/services/public-registration";

export const Route = createFileRoute("/cadastro")({
  ssr: false,
  component: Cadastro,
});

const roles: Array<{ value: PublicRegistrationRole; label: string; description: string }> = [
  { value: "doador", label: "Doador", description: "Oferece excedentes alimentares." },
  { value: "transportador", label: "Transportador", description: "Realiza coleta e transporte." },
  {
    value: "instituicao",
    label: "Instituição receptora",
    description: "Confere e recebe as doações.",
  },
];

function Cadastro() {
  const auth = useOperationalAuth();
  const [role, setRole] = useState<PublicRegistrationRole>("doador");
  const [organizationName, setOrganizationName] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  if (!auth.configured) {
    return (
      <RegistrationMessage
        title="Cadastro operacional não configurado"
        detail="Para solicitar cadastro real, configure a SPA Auth0 e a URL da API neste ambiente. A demonstração permanece disponível sem login."
      />
    );
  }
  if (auth.isLoading)
    return (
      <RegistrationMessage
        title="Verificando sessão…"
        detail="Aguarde enquanto validamos sua identidade."
      />
    );
  if (!auth.isAuthenticated) {
    return (
      <RegistrationMessage
        title="Solicitar cadastro"
        detail="Entre com sua identidade Auth0 para enviar uma solicitação. Isso não concede acesso operacional."
      >
        <button
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          onClick={() => void auth.login("/cadastro")}
        >
          Entrar para solicitar cadastro
        </button>
      </RegistrationMessage>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    setSending(true);
    try {
      const response = await submitPublicRegistration(await auth.getAccessToken(), {
        requestedRole: role,
        organizationName,
      });
      setMessage(`${response.message} Status: ${response.status}.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível registrar a solicitação.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold">Solicitar cadastro</h1>
      <p className="mt-2 text-muted-foreground">
        Doador, Transportador e Instituição podem solicitar análise. Criar uma conta não aprova
        automaticamente uma organização.
      </p>
      <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm font-medium text-warning-foreground">
        Gestores e operadores recebem acesso exclusivamente por convite autorizado. Administradores
        e revisores autorizados também não têm cadastro público.
      </p>
      <form className="mt-6 space-y-5" onSubmit={submit}>
        <fieldset>
          <legend className="text-sm font-semibold">Categoria da solicitação</legend>
          <div className="mt-2 grid gap-2">
            {roles.map((item) => (
              <label key={item.value} className="flex cursor-pointer gap-3 rounded-md border p-3">
                <input
                  type="radio"
                  name="role"
                  value={item.value}
                  checked={role === item.value}
                  onChange={() => setRole(item.value)}
                />
                <span>
                  <strong>{item.label}</strong>
                  <span className="block text-sm text-muted-foreground">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold" htmlFor="organization-name">
          Nome da organização
          <input
            id="organization-name"
            required
            minLength={3}
            maxLength={160}
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            className="mt-1 w-full rounded-md border bg-background p-2 font-normal"
            placeholder="Ex.: Cozinha Comunitária Exemplo"
          />
        </label>
        <button
          disabled={sending}
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {sending ? "Enviando…" : "Enviar solicitação"}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-4 rounded-md bg-success/10 p-3 text-sm text-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        A validação sanitária depende de profissional legalmente habilitado quando aplicável.
      </p>
      <Link to="/" className="mt-6 text-sm underline">
        Voltar à página pública
      </Link>
    </main>
  );
}

function RegistrationMessage({
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
