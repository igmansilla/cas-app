import { createFileRoute } from '@tanstack/react-router';

import {
  EconomiaSectionDenied,
  EconomiaSectionLayout,
} from '../components/calendario/departamentos/EconomiaSectionLayout';
import { DefinicionPlanesPageContent } from '../components/pagos/DefinicionPlanesPageContent';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/_auth/departamentos/economia/planes')({
  component: EconomiaPlanesRoute,
});

function EconomiaPlanesRoute() {
  const { hasGroup, hasRole } = useAuth();
  const canManagePlanes = hasGroup('CONSEJO') || hasRole('admin');

  return (
    <EconomiaSectionLayout currentTab="planes">
      {canManagePlanes ? (
        <DefinicionPlanesPageContent />
      ) : (
        <EconomiaSectionDenied
          title="No tenés acceso a la definición de planes"
          description="La configuración de planes queda restringida al consejo y a los administradores del sistema."
        />
      )}
    </EconomiaSectionLayout>
  );
}
