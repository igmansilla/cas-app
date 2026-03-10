import { createFileRoute } from '@tanstack/react-router';

import { DepartamentoPlanningPage } from '../components/calendario/departamentos/DepartamentoPlanningPage';

export const Route = createFileRoute('/_auth/departamentos/operaciones')({
  component: OperacionesDepartamentoRoute,
});

function OperacionesDepartamentoRoute() {
  return <DepartamentoPlanningPage departamentoCodigo="OPERACIONES" />;
}
