import { createFileRoute } from '@tanstack/react-router'
import { User } from 'oidc-client-ts';
import { type RouterContext } from './__root';

export const Route = createFileRoute('/_auth/grupos')({
  beforeLoad: ({ context }) => {
     const ctx = context as RouterContext;
     const user = ctx.auth.user as User | null;
     const groups = (user?.profile as any)?.groups || [];
     if (!groups.includes('CONSEJO')) {
         console.warn('User not in CONSEJO group', groups);
         // throw redirect({ to: '/dashboard' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/grupos"! (Restricted to CONSEJO)</div>
}

