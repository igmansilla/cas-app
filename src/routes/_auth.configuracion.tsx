import { createFileRoute } from '@tanstack/react-router';
import { Bell, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Route = createFileRoute('/_auth/configuracion')({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="w-5 h-5" />
            Configuracion
          </CardTitle>
          <CardDescription>Preferencias generales de la cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            <p className="font-medium">Notificaciones</p>
            <p className="mt-1">
              La configuracion de notificaciones se gestiona desde la campanita de Novu en el menu de usuario.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-orange-300 bg-white px-3 py-1.5 text-orange-800">
              <Bell className="h-4 w-4" />
              <span>Usa la campanita para ver y administrar tus avisos.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
