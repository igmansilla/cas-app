import { oidcSpa } from "oidc-spa/react-spa";
import { z } from "zod";

export const {
    bootstrapOidc,
    useOidc,
    getOidc,
    OidcInitializationGate,
} = oidcSpa
    .withExpectedDecodedIdTokenShape({
        decodedIdTokenSchema: z.object({
            sub: z.string(),
            name: z.string().optional(),
            preferred_username: z.string().optional(),
            email: z.string().email().optional(),
            picture: z.string().optional(),
            // Keycloak sends groups at top level
            groups: z.array(z.string()).optional(),
            // Keycloak sends roles at top level (not under realm_access)
            roles: z.array(z.string()).optional(),
        }),
        decodedIdToken_mock: {
            sub: "mock-user-id",
            name: "Usuario Demo",
            preferred_username: "demo.user",
            email: "demo@example.com",
            groups: ["CAS", "HUEMUL"],
            roles: ["DIRIGENTE", "ADMIN", "ACAMPANTE"],
        },
    })
    .createUtils();

const configuredKeycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL || "").trim();
const localKeycloakOverride = (import.meta.env.VITE_KEYCLOAK_URL_LOCAL_OVERRIDE || "http://localhost:8181").trim();
const isBrowserLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

function normalizeKeycloakUrl(rawUrl: string): string {
    if (!rawUrl) {
        return rawUrl;
    }

    try {
        const parsed = new URL(rawUrl);
        const isLocalhostHost = ["localhost", "127.0.0.1"].includes(parsed.hostname);

        // Evitar hosts localhost sin puerto o con https cuando Keycloak local corre en 8181/http.
        if (isLocalhostHost) {
            if (!parsed.port) {
                parsed.port = "8181";
            }
            parsed.protocol = "http:";
        }

        return parsed.toString().replace(/\/$/, "");
    } catch {
        return rawUrl;
    }
}

// En desarrollo local (app en localhost), evitar issuer cross-site con local-app
// porque el silent signin en iframe depende de cookies y puede fallar por políticas del navegador.
const effectiveKeycloakUrl = isBrowserLocalhost && configuredKeycloakUrl.includes("local-app.casayhueque.org")
    ? localKeycloakOverride
    : configuredKeycloakUrl;
const normalizedEffectiveKeycloakUrl = normalizeKeycloakUrl(effectiveKeycloakUrl);

/**
 * Bootstrap OIDC configuration - call this immediately at app start
 */
bootstrapOidc(
    import.meta.env.VITE_OIDC_USE_MOCK === "true"
        ? {
            implementation: "mock",
            isUserInitiallyLoggedIn: true,
        }
        : {
            implementation: "real",
            issuerUri: `${normalizedEffectiveKeycloakUrl}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}`,
            clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "FE",
            debugLogs: import.meta.env.DEV,
        }
);

/**
 * Fetch wrapper that automatically adds Authorization header when logged in
 */
export const fetchWithAuth: typeof fetch = async (input, init) => {
    const oidc = await getOidc();

    if (oidc.isUserLoggedIn) {
        const accessToken = await oidc.getAccessToken();
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${accessToken}`);
        (init ??= {}).headers = headers;
    }

    return fetch(input, init);
};
