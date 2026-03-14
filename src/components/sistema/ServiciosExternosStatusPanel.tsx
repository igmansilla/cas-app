import { AlertTriangle, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { CampoServicioStatus, ServicioExternoStatus, ServiciosExternosStatusResponse } from '../../api/schemas/sistema';

interface ServiciosExternosStatusPanelProps {
  estado: ServiciosExternosStatusResponse;
}

function resolverBadgeCampo(campo: CampoServicioStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} {
  if (campo.status === 'missing') {
    return {
      label: 'Faltante',
      variant: 'destructive',
    };
  }

  if (campo.status === 'default-warning') {
    return {
      label: 'Default (warning)',
      variant: 'outline',
      className: 'border-amber-300 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Configurado',
    variant: 'default',
    className: 'bg-emerald-600 hover:bg-emerald-600',
  };
}

function resolverBadgeServicio(servicio: ServicioExternoStatus): {
  label: string;
  className: string;
} {
  if (servicio.status === 'incomplete') {
    return {
      label: 'Incompleto',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    };
  }

  if (servicio.status === 'warning') {
    return {
      label: 'Warning',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    };
  }

  return {
    label: 'OK',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  };
}

export function ServiciosExternosStatusPanel({ estado }: ServiciosExternosStatusPanelProps) {
  const fechaLectura = new Date(estado.timestamp);
  const hayFaltantes = estado.missingRequiredCount > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="h-5 w-5 text-cyan-700" />
              Estado de secretos y tokens
            </CardTitle>
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              Leido: {Number.isNaN(fechaLectura.getTime()) ? estado.timestamp : fechaLectura.toLocaleString()}
            </Badge>
          </div>
          <CardDescription>
            Se muestran estados de configuracion sin exponer valores sensibles de credenciales o access tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Servicios evaluados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{estado.services.length}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-red-600">Faltantes requeridos</p>
              <p className="mt-1 text-2xl font-semibold text-red-700">{estado.missingRequiredCount}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Warnings</p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">{estado.warningCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {hayFaltantes && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Faltan configuraciones requeridas</AlertTitle>
          <AlertDescription>
            Detectamos {estado.missingRequiredCount} configuracion{estado.missingRequiredCount === 1 ? '' : 'es'} requerida
            {estado.missingRequiredCount === 1 ? '' : 's'} sin setear.
          </AlertDescription>
        </Alert>
      )}

      {!hayFaltantes && estado.warningCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hay configuraciones en warning</AlertTitle>
          <AlertDescription>
            No hay faltantes requeridos, pero se detectaron {estado.warningCount} warning
            {estado.warningCount === 1 ? '' : 's'} por defaults o configuraciones opcionales incompletas.
          </AlertDescription>
        </Alert>
      )}

      {!hayFaltantes && estado.warningCount === 0 && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Todo configurado</AlertTitle>
          <AlertDescription>
            Todos los servicios tienen sus configuraciones requeridas completas.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {estado.services.map((servicio) => {
          const badgeServicio = resolverBadgeServicio(servicio);

          return (
            <Card key={servicio.code} className="border-slate-200">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{servicio.name}</CardTitle>
                  <Badge className={badgeServicio.className}>{badgeServicio.label}</Badge>
                </div>
                <CardDescription>{servicio.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {servicio.fields.map((campo) => {
                    const badgeCampo = resolverBadgeCampo(campo);
                    return (
                      <li
                        key={`${servicio.code}-${campo.key}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{campo.label}</p>
                            {campo.required ? (
                              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                Requerido
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
                                Opcional
                              </Badge>
                            )}
                          </div>
                          <Badge variant={badgeCampo.variant} className={badgeCampo.className}>
                            {badgeCampo.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{campo.key}</p>
                        {campo.detail && <p className="mt-1 text-xs text-slate-600">{campo.detail}</p>}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
