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

        // Don't redirect if already on onboarding page
        if (location.pathname === "/onboarding") return;

        // Check if user is VIP (has dirigente role)
        const isVip = VIP_ROLES.some((role) => auth.hasRole(role));

        // If VIP, no need to check onboarding
        if (isVip) return;

        // If user has familia, they've completed onboarding (even if profile incomplete)
        // They can complete their profile later from the profile page
        if (familia) return;

        // If user data loaded but no familia, redirect to onboarding
        if (usuario && !familia) {
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
                {!isOnboarding && <MobileHeader />}
                {!isOnboarding && <MobileFooter />}
                <main className={`overflow-auto ${isOnboarding ? '' : 'pb-24 md:pb-6'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

