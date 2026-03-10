import { createFileRoute } from '@tanstack/react-router';

import { EconomiaSectionLayout } from '../components/calendario/departamentos/EconomiaSectionLayout';

export const Route = createFileRoute('/_auth/departamentos/economia/')({
  component: EconomiaHubRoute,
});

function EconomiaHubRoute() {
  return <EconomiaSectionLayout currentTab="hub" />;
}
