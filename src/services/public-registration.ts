export type PublicRegistrationRole = "doador" | "transportador" | "instituicao";

type RegistrationResponse = {
  id: string;
  status: "PENDENTE";
  message: string;
};

export async function submitPublicRegistration(
  accessToken: string,
  payload: { requestedRole: PublicRegistrationRole; organizationName: string },
): Promise<RegistrationResponse> {
  const baseUrl = import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("Cadastro indisponível: VITE_API_BASE_URL não foi configurada.");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/access/registration-requests`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requested_role: payload.requestedRole,
        organization_name: payload.organizationName.trim(),
      }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  }
  const body = (await response.json().catch(() => null)) as
    { detail?: string } | RegistrationResponse | null;
  if (!response.ok) {
    throw new Error(
      (body as { detail?: string } | null)?.detail ?? "Não foi possível registrar a solicitação.",
    );
  }
  return body as RegistrationResponse;
}
