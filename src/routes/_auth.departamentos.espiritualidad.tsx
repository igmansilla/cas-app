import { createFileRoute } from '@tanstack/react-router';

import { DepartamentoPlanningPage } from '../components/calendario/departamentos/DepartamentoPlanningPage';

export const Route = createFileRoute('/_auth/departamentos/espiritualidad')({
  component: EspiritualidadDepartamentoRoute,
});

function EspiritualidadDepartamentoRoute() {
  return <DepartamentoPlanningPage departamentoCodigo="ESPIRITUALIDAD" />;
}
