import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/departamentos/economia')({
  component: EconomiaRoute,
});

function EconomiaRoute() {
  return <Outlet />;
}
