import { createFileRoute } from '@tanstack/react-router';

import { DepartamentoPlanningPage } from '../components/calendario/departamentos/DepartamentoPlanningPage';

export const Route = createFileRoute('/_auth/departamentos/comunicaciones')({
  component: ComunicacionesDepartamentoRoute,
});

function ComunicacionesDepartamentoRoute() {
  return <DepartamentoPlanningPage departamentoCodigo="COMUNICACIONES" />;
}
