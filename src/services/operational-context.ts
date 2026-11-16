export type AuthorizedOrganization = {
  id: string;
  name: string;
  roles: string[];
};

export type OperationalContext = {
  subject: string;
  known_user: boolean;
  organizations: AuthorizedOrganization[];
  registration: { status: string; requested_role: string; organization_name: string } | null;
  onboarding:
    "AUTORIZADO" | "CADASTRO_PENDENTE" | "AGUARDANDO_CONVITE" | "ACESSO_REVOGADO" | "SEM_ACESSO";
};

function apiBaseUrl() {
  const baseUrl = import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("Integração indisponível: VITE_API_BASE_URL não foi configurada.");
  return baseUrl;
}

export async function getOperationalContext(accessToken: string): Promise<OperationalContext> {
  const baseUrl = apiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error("API indisponível. Verifique sua conexão e tente novamente.");
  }
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  if (response.status === 401)
    throw new Error("Sua sessão expirou ou o token não é válido. Entre novamente.");
  if (response.status === 403)
    throw new Error("Sua identidade não possui autorização operacional.");
  if (!response.ok)
    throw new Error(body?.detail || "Não foi possível carregar seu contexto operacional.");
  return body as unknown as OperationalContext;
}
