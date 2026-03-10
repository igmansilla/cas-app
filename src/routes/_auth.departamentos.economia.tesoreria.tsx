import { createFileRoute } from '@tanstack/react-router';

import {
  EconomiaSectionDenied,
  EconomiaSectionLayout,
} from '../components/calendario/departamentos/EconomiaSectionLayout';
import { TesoreriaPageContent } from '../components/tesoreria/TesoreriaPageContent';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/_auth/departamentos/economia/tesoreria')({
  component: EconomiaTesoreriaRoute,
});

function EconomiaTesoreriaRoute() {
  const { hasRole } = useAuth();
  const canAccessTesoreria = hasRole('admin') || hasRole('tesorero') || hasRole('revisor');

  return (
    <EconomiaSectionLayout currentTab="tesoreria">
      {canAccessTesoreria ? (
        <TesoreriaPageContent />
      ) : (
        <EconomiaSectionDenied
          title="No tenés acceso a Tesorería"
          description="Esta superficie queda reservada para administración financiera, tesorería y revisión."
        />
      )}
    </EconomiaSectionLayout>
  );
}
