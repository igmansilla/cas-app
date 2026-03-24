import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Use useEffect for navigation to avoid "Cannot update a component while rendering" error
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  // If authenticated, show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="text-center p-8">
        <img 
          src="/logo_transparent.png" 
          alt="Logo Campamento Andino Sayhueque" 
          className="w-32 h-32 mx-auto mb-6"
        />
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Bienvenido al CAS
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sistema de gestión de campamento
        </p>
        <button
          onClick={login}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
