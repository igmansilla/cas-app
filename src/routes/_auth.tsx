import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import MobileHeader from "../components/MobileHeader";
import MobileFooter from "../components/MobileFooter";
import { useUsuarioActual } from "../hooks/useUsuarioActual";
import { useMiFamilia } from "../hooks/useFamilia";
import { useOidc } from "../oidc";

// VIP roles that skip onboarding
const VIP_ROLES = ["dirigente"];

function getMobileHeaderTitle(pathname: string): string | undefined {
    if (pathname.startsWith("/calendario")) return "Calendario";
    if (pathname.startsWith("/dashboard")) return "Inicio";
    if (pathname.startsWith("/pagos")) return "Pagos";
    if (pathname.startsWith("/documentos")) return "Documentos";
    if (pathname.startsWith("/equipo")) return "Equipo";
    if (pathname.startsWith("/usuarios")) return "Acampantes";
    if (pathname.startsWith("/sistema")) return "Sistema";
    if (pathname.startsWith("/perfil")) return "Perfil";
    if (pathname.startsWith("/configuracion")) return "Configuracion";
    if (pathname.startsWith("/departamentos/economia/planificacion")) return "Economia - Planificacion";
    if (pathname.startsWith("/departamentos/economia/tesoreria")) return "Economia - Tesoreria";
    if (pathname.startsWith("/departamentos/economia/planes")) return "Economia - Planes";
    if (pathname.startsWith("/departamentos/economia")) return "Economia";
    if (pathname.startsWith("/departamentos")) return "Departamentos";
    if (pathname.startsWith("/reuniones")) return "Reuniones";
    if (pathname.startsWith("/planes")) return "Planes";
    if (pathname.startsWith("/template-editor")) return "Editor";
    return undefined;
}

export const Route = createFileRoute("/_auth")({
    component: AuthLayout,
});

function AuthLayout() {
    const auth = useAuth();
    const oidc = useOidc();
    const location = useLocation();
    const navigate = useNavigate();
    const { data: usuario, isLoading: isLoadingUsuario } = useUsuarioActual();
    const { data: familia, isLoading: isLoadingFamilia } = useMiFamilia();

    // Ocultar navegación durante onboarding
    const isOnboarding = location.pathname === "/onboarding";
    const isCalendario = location.pathname.startsWith("/calendario");
    const mobileHeaderTitle = isOnboarding ? undefined : getMobileHeaderTitle(location.pathname);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!oidc.isUserLoggedIn) {
            oidc.login({});
        }
    }, [oidc]);

    // Check if user needs onboarding redirect
    useEffect(() => {
        // Don't do anything while loading
        if (!auth.isAuthenticated || isLoadingUsuario || isLoadingFamilia) return;

        // Check if user is VIP (has dirigente role)
        const isVip = VIP_ROLES.some((role) => auth.hasRole(role));

        // If VIP, no need to check onboarding
        if (isVip) return;

        // If user has familia and is on onboarding page, redirect to dashboard
        // This prevents trying to join/create when they already have a family
        if (familia?.uid && location.pathname === "/onboarding") {
            navigate({ to: "/dashboard" });
            return;
        }

        // Don't redirect if already on onboarding page
        if (location.pathname === "/onboarding") return;

        // If user has familia (uid is not null), they've completed onboarding
        // They can complete their profile later from the profile page
        if (familia?.uid) return;

        // If user data loaded but no familia, redirect to onboarding
        if (usuario && !familia?.uid) {
            navigate({ to: "/onboarding" });
        }
    }, [
        auth.isAuthenticated,
        auth.hasRole,
        isLoadingUsuario,
        isLoadingFamilia,
        usuario,
        familia,
        location.pathname,
        navigate,
    ]);

    // Show loading if not logged in (will redirect)
    if (!oidc.isUserLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    // Show loading while checking usuario/familia data for non-VIP users
    const isVip = VIP_ROLES.some((role) => auth.hasRole(role));
    if (!isVip && (isLoadingUsuario || isLoadingFamilia) && location.pathname !== "/onboarding") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-white">
            <div className={`h-full ${isOnboarding ? 'grid grid-rows-[1fr]' : 'grid grid-rows-[auto_auto_1fr] md:grid-rows-[auto_1fr]'}`}>
                {!isOnboarding && !isCalendario && <MobileHeader title={mobileHeaderTitle} />}
                {!isOnboarding && <MobileFooter />}
                <main className={`overflow-auto ${isOnboarding ? '' : 'pb-24 md:pb-6'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

