import { createFileRoute } from '@tanstack/react-router';

import { EconomiaSectionLayout } from '../components/calendario/departamentos/EconomiaSectionLayout';
import { DepartamentoPlanningPage } from '../components/calendario/departamentos/DepartamentoPlanningPage';

export const Route = createFileRoute('/_auth/departamentos/economia/planificacion')({
  component: EconomiaPlanificacionRoute,
});

function EconomiaPlanificacionRoute() {
  return (
    <EconomiaSectionLayout currentTab="planificacion">
      <DepartamentoPlanningPage departamentoCodigo="ECONOMIA" embedded />
    </EconomiaSectionLayout>
  );
}
