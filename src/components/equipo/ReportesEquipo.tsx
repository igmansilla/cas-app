import { useState } from 'react';
import { Users, Eye, AlertCircle, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  useReporteProgreso,
  useDetalleProgresoUsuario,
} from '../../hooks/useEquipo';
import { equipoService } from '../../api/services/equipo';
import { CRITICIDAD_CONFIG } from '../../api/schemas/equipo';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import { ProtectedEquipoImage } from './ProtectedEquipoImage';

/**
 * Panel de reportes de progreso de usuarios
 */
export function ReportesEquipo() {
  const [grupoId, setGrupoId] = useState<string>('');
  const { usuarios, cargando } = useReporteProgreso(grupoId || undefined);
  const [usuarioDetalle, setUsuarioDetalle] = useState<number | null>(null);

  // Calcular estadísticas
  const totalUsuarios = usuarios.length;
  const promedioProgreso = totalUsuarios > 0
    ? Math.round(usuarios.reduce((acc, u) => acc + u.porcentaje, 0) / totalUsuarios)
    : 0;
  const conCriticos = usuarios.filter((u) => u.criticosFaltantes > 0).length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtro */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-gray-900">Reporte de Progreso</h3>

        <Select value={grupoId || '_all'} onValueChange={(v) => setGrupoId(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos los grupos</SelectItem>
            {/* TODO: Cargar grupos desde API */}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Usuarios"
          value={totalUsuarios.toString()}
        />
        <StatCard
          icon={<div className="w-5 h-5 rounded-full border-4 border-orange-500 border-t-transparent" />}
          label="Promedio"
          value={`${promedioProgreso}%`}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="Con críticos faltantes"
          value={conCriticos.toString()}
          highlight={conCriticos > 0}
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Header */}
        <div className="hidden grid-cols-12 gap-2 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 uppercase sm:grid">
          <div className="col-span-3">Usuario</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Progreso</div>
          <div className="col-span-2">Críticos</div>
          <div className="col-span-1">Última act.</div>
          <div className="col-span-1"></div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-gray-100">
          {usuarios.map((usuario) => (
            <div
              key={usuario.usuarioId}
              className="grid grid-cols-1 items-center gap-2 px-4 py-3 hover:bg-gray-50 sm:grid-cols-12"
            >
              {/* Mobile: Todo junto */}
              <div className="space-y-2 sm:hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{usuario.nombreMostrar || 'Sin nombre'}</p>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUsuarioDetalle(usuario.usuarioId)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar progress={usuario.porcentaje} />
                  {usuario.criticosFaltantes > 0 && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {usuario.criticosFaltantes}
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden sm:block col-span-3">
                <p className="font-medium text-gray-900 truncate">
                  {usuario.nombreMostrar || 'Sin nombre'}
                </p>
              </div>
              <div className="hidden sm:block col-span-3">
                <p className="text-sm text-gray-500 truncate">{usuario.email}</p>
              </div>
              <div className="hidden sm:block col-span-2">
                <ProgressBar progress={usuario.porcentaje} />
              </div>
              <div className="hidden sm:flex col-span-2 items-center gap-1">
                {usuario.criticosFaltantes > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-red-600">{usuario.criticosFaltantes}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </div>
              <div className="hidden sm:block col-span-1">
                <p className="text-xs text-gray-400">
                  {usuario.ultimaActualizacion
                    ? formatDistanceToNow(new Date(usuario.ultimaActualizacion), {
                        addSuffix: true,
                        locale: es,
                      })
                    : '-'}
                </p>
              </div>
              <div className="hidden sm:flex col-span-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setUsuarioDetalle(usuario.usuarioId)}
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </div>
          ))}

          {usuarios.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Users className="mx-auto mb-2 w-10 h-10 text-gray-300" />
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {usuarioDetalle && (
        <DetalleUsuarioModal
          usuarioId={usuarioDetalle}
          onClose={() => setUsuarioDetalle(null)}
        />
      )}
    </div>
  );
}

/**
 * Card de estadística
 */
function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border p-4',
      highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
    )}>
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

/**
 * Barra de progreso inline
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full transition-all duration-300',
            progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-orange-500' : 'bg-orange-400'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-medium text-gray-600">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

/**
 * Modal con detalle del progreso de un usuario
 */
function DetalleUsuarioModal({
  usuarioId,
  onClose,
}: {
  usuarioId: number;
  onClose: () => void;
}) {
  const { detalle, cargando } = useDetalleProgresoUsuario(usuarioId);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>
            {cargando ? 'Cargando...' : detalle?.nombreMostrar || detalle?.email || 'Usuario'}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detalle ? (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{detalle.resumen.porcentajeGeneral}%</p>
                  <p className="text-xs text-gray-500">Completado</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {detalle.resumen.criticosCompletados}/{detalle.resumen.criticosTotal}
                  </p>
                  <p className="text-xs text-gray-500">Críticos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {detalle.resumen.importantesCompletados}/{detalle.resumen.importantesTotal}
                  </p>
                  <p className="text-xs text-gray-500">Importantes</p>
                </div>
              </div>

              {/* Categorías */}
              <div className="space-y-4">
                {detalle.categorias.map((cat) => (
                  <div key={cat.categoriaId} className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                      <h4 className="font-medium text-gray-900">{cat.nombre}</h4>
                      <span className="text-sm text-gray-500">
                        {cat.completados}/{cat.total}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {cat.items.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-center gap-3 px-4 py-2"
                        >
                          {/* Checkbox visual (solo lectura) */}
                          <div className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border-2',
                            item.completado
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300'
                          )}>
                            {item.completado && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          {/* Dot de criticidad */}
                          {item.criticidad !== 'NORMAL' && !item.completado && (
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              CRITICIDAD_CONFIG[item.criticidad].dotColor,
                              item.criticidad === 'CRITICO' && 'animate-pulse'
                            )} />
                          )}

                          {/* Nombre */}
                          <span className={cn(
                            'flex-1',
                            item.completado && 'line-through text-gray-400'
                          )}>
                            {item.cantidad > 1 && <span className="mr-1 text-gray-500">{item.cantidad}x</span>}
                            {item.nombre}
                          </span>

                          {item.totalFotosSugeridas > 0 && (
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                              item.fotosCargadas === item.totalFotosSugeridas
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            )}>
                              <Camera className="h-3 w-3" />
                              {item.fotosCargadas}/{item.totalFotosSugeridas}
                            </span>
                          )}

                          {item.totalFotosSugeridas > 0 && (
                            <FotosItemViewer
                              usuarioId={usuarioId}
                              itemName={item.nombre}
                              requisitosFoto={item.requisitosFoto}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No se pudo cargar el detalle
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente para revisar las fotos guiadas de un item con token
 */
function FotosItemViewer({
  usuarioId,
  itemName,
  requisitosFoto,
}: {
  usuarioId: number;
  itemName: string;
  requisitosFoto: Array<{
    requisitoId: number;
    titulo: string;
    descripcion: string | null;
    hasFoto: boolean;
    fechaSubida: string | null;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cargadas = requisitosFoto.filter((requisito) => requisito.hasFoto).length;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        onClick={() => setIsOpen(true)}
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>{itemName}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Revisión visual del item</p>
                <p className="text-xs text-gray-500">Vistas cargadas: {cargadas}/{requisitosFoto.length}</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {requisitosFoto.map((requisito) => (
                <div key={requisito.requisitoId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{requisito.titulo}</h4>
                      {requisito.descripcion && (
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{requisito.descripcion}</p>
                      )}
                    </div>
                    <span className={cn(
                      'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                      requisito.hasFoto
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    )}>
                      {requisito.hasFoto ? 'Cargada' : 'Faltante'}
                    </span>
                  </div>

                  <div className="p-4">
                    {requisito.hasFoto ? (
                      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                        <ProtectedEquipoImage
                          url={equipoService.getAdminRequisitoFotoUrl(usuarioId, requisito.requisitoId)}
                          alt={`${itemName} - ${requisito.titulo}`}
                          className="h-full w-full object-contain"
                          loadingFallback={<div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                        Todavía no cargó esta vista.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
