import { createFileRoute } from '@tanstack/react-router';

import { DepartamentosHubPage } from '../components/calendario/departamentos/DepartamentosHubPage';

export const Route = createFileRoute('/_auth/departamentos/')({
  component: DepartamentosHubRoute,
});

function DepartamentosHubRoute() {
  return <DepartamentosHubPage />;
}
