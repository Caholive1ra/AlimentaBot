import { Auth0Provider, useAuth0, type User } from "@auth0/auth0-react";
import { createContext, useContext, type ReactNode } from "react";

type OperationalAuth = {
  configured: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | undefined;
  login: (returnTo?: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
};

const unavailable = async () => {
  throw new Error("A autenticação operacional não está configurada neste ambiente.");
};

const AuthContext = createContext<OperationalAuth>({
  configured: false,
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  login: unavailable,
  logout: () => undefined,
  getAccessToken: unavailable,
});
const unconfiguredContext: OperationalAuth = {
  configured: false,
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  login: unavailable,
  logout: () => undefined,
  getAccessToken: unavailable,
};

const config = {
  mode: import.meta.env["VITE_DATA_MODE"],
  domain: import.meta.env["VITE_AUTH0_DOMAIN"],
  clientId: import.meta.env["VITE_AUTH0_CLIENT_ID"],
  audience: import.meta.env["VITE_AUTH0_AUDIENCE"],
};

export const isOperationalAuthConfigured =
  config.mode === "connected" && Boolean(config.domain && config.clientId && config.audience);

function Auth0StateProvider({ children }: { children: ReactNode }) {
  const auth = useAuth0();
  return (
    <AuthContext.Provider
      value={{
        configured: true,
        isLoading: auth.isLoading,
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        login: async (returnTo = "/operacional") => {
          await auth.loginWithRedirect({ appState: { returnTo } });
        },
        logout: () => auth.logout({ logoutParams: { returnTo: window.location.origin } }),
        getAccessToken: async () => {
          const token = await auth.getAccessTokenSilently();
          if (!token) throw new Error("Não foi possível obter um access token para a API.");
          return token;
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AlimentaAuthProvider({ children }: { children: ReactNode }) {
  // This is deliberately a SPA-only provider. The public SSR landing never receives a token.
  if (typeof window === "undefined" || !isOperationalAuthConfigured) {
    return <AuthContext.Provider value={unconfiguredContext}>{children}</AuthContext.Provider>;
  }

  return (
    <Auth0Provider
      domain={config.domain!}
      clientId={config.clientId!}
      authorizationParams={{ audience: config.audience, redirect_uri: window.location.origin }}
      cacheLocation="memory"
      useRefreshTokens
      onRedirectCallback={(appState) =>
        window.history.replaceState({}, document.title, appState?.returnTo ?? "/operacional")
      }
    >
      <Auth0StateProvider>{children}</Auth0StateProvider>
    </Auth0Provider>
  );
}

export function useOperationalAuth() {
  return useContext(AuthContext);
}
