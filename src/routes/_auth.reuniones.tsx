import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/reuniones")({
  component: ReunionesRedirectPage,
});

function ReunionesRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/usuarios", search: { tab: "reuniones" }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-12">
      <div className="text-center text-sm text-muted-foreground">Redirigiendo a Acampantes y grupos...</div>
    </div>
  );
}
