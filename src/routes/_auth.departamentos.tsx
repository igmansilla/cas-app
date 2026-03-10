import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/departamentos')({
  component: DepartamentosRoute,
});

function DepartamentosRoute() {
  return <Outlet />;
}
