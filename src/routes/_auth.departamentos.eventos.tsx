import { createFileRoute } from '@tanstack/react-router';

import { DepartamentoPlanningPage } from '../components/calendario/departamentos/DepartamentoPlanningPage';

export const Route = createFileRoute('/_auth/departamentos/eventos')({
  component: EventosDepartamentoRoute,
});

function EventosDepartamentoRoute() {
  return <DepartamentoPlanningPage departamentoCodigo="EVENTOS" />;
}
