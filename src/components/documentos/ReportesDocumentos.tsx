/**
 * ReportesDocumentos Component
 *
 * Dashboard para dirigentes y secretario para ver el estado de documentación.
 * Muestra estadísticas generales y detalle por usuario.
 */

import { useState, useMemo, useEffect } from 'react';
import { Users, Eye, CheckCircle, Clock, AlertTriangle, Search, ChevronDown, Printer, Loader2, FileDown } from 'lucide-react';
import { useReporteDocumentosGeneral, useReporteDocumentosGrupo } from '../../hooks/useDocumentos';
import { useGruposAcampantes } from '../../hooks/useGrupos';
import { useAuth } from '../../hooks/useAuth';
import type { ResumenDocumentosMiembro, DocumentoCompletado } from '../../api/schemas/documentos';
import { FichaMedicaBulkPrint } from './FichaMedicaBulkPrint';
import { GenerarPdfModal } from './GenerarPdfModal';
import { documentosService } from '../../api/services/documentos';

interface ReportesDocumentosProps {
  onSelectUsuario?: (keycloakId: string, usuarioNombre?: string) => void;
}

export function ReportesDocumentos({ onSelectUsuario }: ReportesDocumentosProps) {
  const { hasRole } = useAuth();
  const esSecretario = hasRole('SECRETARIO') || hasRole('ADMIN');
  
  // Cargar grupos reales desde Keycloak
  const { grupos: gruposKeycloak, cargando: cargandoGrupos } = useGruposAcampantes();
  
  // Crear lista de opciones con "Todos" al principio
  const opcionesGrupos = useMemo(() => {
    const opciones = [{ id: 'all', nombre: 'Todos los grupos' }];
    gruposKeycloak.forEach(g => opciones.push({ id: g.id, nombre: g.nombre }));
    return opciones;
  }, [gruposKeycloak]);

  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | undefined>(
    esSecretario ? undefined : gruposKeycloak[0]?.id
  );
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para impresión masiva
  const [mostrarBulkPrint, setMostrarBulkPrint] = useState(false);
  const [cargandoBulk, setCargandoBulk] = useState(false);
  const [documentosBulk, setDocumentosBulk] = useState<Array<{
    documento: DocumentoCompletado;
    usuario: { id: number; keycloakId: string; nombreMostrar: string; dni?: string | null; fechaNacimiento?: string | null; direccion?: string | null; localidad?: string | null; telefono?: string | null; email: string };
  }>>([]);

  // Estado para generación de PDFs
  const [mostrarGenerarPdf, setMostrarGenerarPdf] = useState(false);
  const [usuarioParaPdf, setUsuarioParaPdf] = useState<{
    id: number;
    keycloakId: string;
    nombreMostrar: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (!esSecretario && !grupoSeleccionado && gruposKeycloak.length > 0) {
      setGrupoSeleccionado(gruposKeycloak[0].id);
    }
  }, [esSecretario, grupoSeleccionado, gruposKeycloak]);

  // Usar reporte general para secretario, o reporte de grupo para dirigentes
  const { reporte: reporteGeneral, cargando: cargandoGeneral } = useReporteDocumentosGeneral();
  const { reporte: reporteGrupo, cargando: cargandoGrupo } = useReporteDocumentosGrupo(grupoSeleccionado);

  const reporte = esSecretario && !grupoSeleccionado ? reporteGeneral : reporteGrupo;
  const cargando = esSecretario && !grupoSeleccionado ? cargandoGeneral : cargandoGrupo;

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = reporte?.detalleUsuarios?.filter(u => 
    !busqueda || 
    u.usuarioNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.usuarioEmail?.toLowerCase().includes(busqueda.toLowerCase())
  ) || [];

  // Cargar documentos para impresión masiva
  const handleBulkPrint = async () => {
    if (!reporte?.detalleUsuarios) return;
    
    setCargandoBulk(true);
    try {
      const docs: typeof documentosBulk = [];
      
      // Cargar documentos de cada usuario que tenga documentos completos
      for (const usuario of reporte.detalleUsuarios) {
        if (usuario.documentosCompletos === 0) continue;
        if (!usuario.keycloakId) continue;
        
        const documentosUsuario = await documentosService.getDetalleDocumentosUsuario(usuario.keycloakId);
        const fichaMedica = documentosUsuario.find(d => d.tipoDocumentoCodigo === 'FICHA_MEDICA' && d.id !== null);
        
        if (fichaMedica) {
          docs.push({
            documento: fichaMedica,
            usuario: {
              id: usuario.usuarioId,
              keycloakId: usuario.keycloakId,
              nombreMostrar: usuario.usuarioNombre || 'Sin nombre',
              email: usuario.usuarioEmail || '',
              dni: null,
              fechaNacimiento: null,
              direccion: null,
              localidad: null,
              telefono: null,
            }
          });
        }
      }
      
      setDocumentosBulk(docs);
      setMostrarBulkPrint(true);
    } catch (error) {
      console.error('Error cargando documentos:', error);
      alert('Error al cargar documentos para impresión');
    } finally {
      setCargandoBulk(false);
    }
  };

  if (cargando || cargandoGrupos) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal de impresión masiva */}
      {mostrarBulkPrint && (
        <FichaMedicaBulkPrint
          documentos={documentosBulk}
          onClose={() => setMostrarBulkPrint(false)}
        />
      )}

      {/* Botones de acciones */}
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-end">
        <button
          onClick={handleBulkPrint}
          disabled={cargandoBulk || usuariosFiltrados.length === 0}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {cargandoBulk ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Imprimir fichas médicas
        </button>
        <button
          onClick={() => setMostrarGenerarPdf(true)}
          disabled={usuariosFiltrados.length === 0}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          Generar PDFs
        </button>
      </div>

      {/* Modal de generación de PDFs */}
      {mostrarGenerarPdf && (
        <GenerarPdfModal
          usuario={usuarioParaPdf ? {
            id: usuarioParaPdf.id,
            keycloakId: usuarioParaPdf.keycloakId,
            nombreMostrar: usuarioParaPdf.nombreMostrar,
            email: usuarioParaPdf.email,
            dni: null,
            fechaNacimiento: null,
            direccion: null,
            localidad: null,
            telefono: null,
          } : undefined}
          usuarios={!usuarioParaPdf
            ? usuariosFiltrados
                .filter((u) => !!u.keycloakId)
                .map((u) => ({
                  id: u.usuarioId,
                  keycloakId: u.keycloakId!,
                  nombreMostrar: u.usuarioNombre || 'Sin nombre',
                  email: u.usuarioEmail || '',
                  dni: null,
                  fechaNacimiento: null,
                  direccion: null,
                  localidad: null,
                  telefono: null,
                }))
            : undefined}
          onClose={() => {
            setMostrarGenerarPdf(false);
            setUsuarioParaPdf(null);
          }}
        />
      )}

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total usuarios"
          value={reporte?.totalUsuarios || 0}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Completos"
          value={reporte?.usuariosCompletos || 0}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="En progreso"
          value={reporte?.usuariosParciales || 0}
          color="yellow"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Sin iniciar"
          value={reporte?.usuariosSinIniciar || 0}
          color="red"
        />
      </div>

      {/* Progreso promedio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completitud promedio</span>
          <span className="text-lg font-bold text-orange-600">
            {Math.round(reporte?.porcentajePromedioCompletitud || 0)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
            style={{ width: `${reporte?.porcentajePromedioCompletitud || 0}%` }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Selector de grupo */}
        {esSecretario && (
          <div className="relative">
            <select
              value={grupoSeleccionado || 'all'}
              onChange={(e) => setGrupoSeleccionado(e.target.value === 'all' ? undefined : e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {opcionesGrupos.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {usuariosFiltrados.map((usuario) => (
          <UsuarioMobileCard
            key={usuario.keycloakId || String(usuario.usuarioId)}
            usuario={usuario}
            onClick={onSelectUsuario && usuario.keycloakId ? () => onSelectUsuario(usuario.keycloakId!, usuario.usuarioNombre ?? undefined) : undefined}
            onGenerarPdf={() => {
              if (!usuario.keycloakId) return;
              setUsuarioParaPdf({
                id: usuario.usuarioId,
                keycloakId: usuario.keycloakId,
                nombreMostrar: usuario.usuarioNombre || 'Sin nombre',
                email: usuario.usuarioEmail || '',
              });
              setMostrarGenerarPdf(true);
            }}
          />
        ))}

        {usuariosFiltrados.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-gray-500 shadow-sm">
            No se encontraron usuarios
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Usuario
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Progreso
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Completos
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Pendientes
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuariosFiltrados.map((usuario) => (
              <UsuarioRow
                key={usuario.keycloakId || String(usuario.usuarioId)}
                usuario={usuario}
                onClick={usuario.keycloakId ? () => onSelectUsuario?.(usuario.keycloakId!, usuario.usuarioNombre ?? undefined) : undefined}
                onGenerarPdf={() => {
                  if (!usuario.keycloakId) return;
                  setUsuarioParaPdf({
                    id: usuario.usuarioId,
                    keycloakId: usuario.keycloakId,
                    nombreMostrar: usuario.usuarioNombre || 'Sin nombre',
                    email: usuario.usuarioEmail || '',
                  });
                  setMostrarGenerarPdf(true);
                }}
              />
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPorcentaje(usuario: ResumenDocumentosMiembro) {
  return usuario.totalDocumentos > 0
    ? Math.round((usuario.documentosCompletos / usuario.totalDocumentos) * 100)
    : 0;
}

function getEstadoInfo(porcentaje: number) {
  if (porcentaje === 100) {
    return {
      label: 'Completo',
      className: 'bg-green-100 text-green-700',
    };
  }

  if (porcentaje === 0) {
    return {
      label: 'Sin iniciar',
      className: 'bg-gray-100 text-gray-600',
    };
  }

  return {
    label: 'En progreso',
    className: 'bg-yellow-100 text-yellow-700',
  };
}

function EstadoBadge({ porcentaje }: { porcentaje: number }) {
  const estado = getEstadoInfo(porcentaje);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${estado.className}`}>
      {estado.label}
    </span>
  );
}

function ProgresoBar({ porcentaje }: { porcentaje: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all ${
            porcentaje === 100 ? 'bg-green-500' : porcentaje > 0 ? 'bg-yellow-500' : 'bg-gray-300'
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-medium text-gray-700">{porcentaje}%</span>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

interface UsuarioRowProps {
  usuario: ResumenDocumentosMiembro;
  onClick?: () => void;
  onGenerarPdf?: () => void;
}

function UsuarioRow({ usuario, onClick, onGenerarPdf }: UsuarioRowProps) {
  const porcentaje = getPorcentaje(usuario);

  return (
    <tr
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="px-4 py-3 cursor-pointer" onClick={onClick}>
        <div>
          <div className="font-medium text-gray-900">{usuario.usuarioNombre || 'Sin nombre'}</div>
          <div className="text-sm text-gray-500">{usuario.usuarioEmail}</div>
        </div>
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-full max-w-[180px]">
            <ProgresoBar porcentaje={porcentaje} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <span className="text-sm text-gray-700">{usuario.documentosCompletos}</span>
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <span className="text-sm text-gray-700">
          {usuario.documentosPendientes + usuario.documentosSinIniciar}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <EstadoBadge porcentaje={porcentaje} />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => { e.stopPropagation(); onGenerarPdf?.(); }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-orange-600 transition-colors hover:bg-orange-50"
          title="Generar PDF"
        >
          <FileDown className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function UsuarioMobileCard({ usuario, onClick, onGenerarPdf }: UsuarioRowProps) {
  const porcentaje = getPorcentaje(usuario);
  const pendientes = usuario.documentosPendientes + usuario.documentosSinIniciar;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{usuario.usuarioNombre || 'Sin nombre'}</p>
          <p className="mt-1 break-all text-sm text-gray-500">{usuario.usuarioEmail || 'Sin email'}</p>
        </div>
        <EstadoBadge porcentaje={porcentaje} />
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>Progreso</span>
          <span className="font-medium text-gray-900">{porcentaje}%</span>
        </div>
        <ProgresoBar porcentaje={porcentaje} />

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="text-xs text-gray-500">Completos</p>
            <p className="text-sm font-semibold text-gray-900">{usuario.documentosCompletos}</p>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="text-xs text-gray-500">Pendientes</p>
            <p className="text-sm font-semibold text-gray-900">{pendientes}</p>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-semibold text-gray-900">{usuario.totalDocumentos}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {onClick && (
          <button
            onClick={onClick}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Ver detalle
          </button>
        )}
        <button
          onClick={onGenerarPdf}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <FileDown className="w-4 h-4" />
          Generar PDF
        </button>
      </div>
    </div>
  );
}

export default ReportesDocumentos;
