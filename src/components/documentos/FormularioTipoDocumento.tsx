/**
 * FormularioTipoDocumento Component
 *
 * Modal para crear/editar tipos de documento.
 * Permite configurar datos generales, campos y adjuntos.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  Settings,
  Paperclip,
  FilePen,
  Calendar,
} from 'lucide-react';
import { useActualizarTipoDocumento, useCrearTipoDocumento } from '../../hooks/useDocumentos';
import { cn } from '../../lib/utils';
import type {
  TipoDocumento,
  AudienciaDocumento,
  TipoCampo,
  CampoRequest,
  AdjuntoRequest,
} from '../../api/schemas/documentos';
import { pdfTemplatesService, type PdfTemplateResponse } from '../../api/services/pdfTemplates';

interface FormularioTipoDocumentoProps {
  tipoDocumento?: TipoDocumento; // Si es undefined, es creación
  onClose: () => void;
  onSuccess?: () => void;
}

type TabId = 'general' | 'campos' | 'adjuntos';

const TIPOS_CAMPO: { value: TipoCampo; label: string }[] = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'TEXTAREA', label: 'Texto largo' },
  { value: 'NUMERO', label: 'Número' },
  { value: 'FECHA', label: 'Fecha' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TELEFONO', label: 'Teléfono' },
  { value: 'SELECCION', label: 'Selección' },
  { value: 'RADIO', label: 'Radio (Sí/No)' },
  { value: 'BOOLEAN', label: 'Checkbox' },
];

const AUDIENCIAS: { value: AudienciaDocumento; label: string; icon: string; color: string }[] = [
  { value: 'ACAMPANTE', label: 'Acampantes', icon: '🏕️', color: 'purple' },
  { value: 'DIRIGENTE', label: 'Dirigentes', icon: '🧭', color: 'teal' },
  { value: 'PADRE', label: 'Padres', icon: '👨‍👩‍👧', color: 'amber' },
  { value: 'TODOS', label: 'Todos', icon: '🌐', color: 'blue' },
];

export function FormularioTipoDocumento({
  tipoDocumento,
  onClose,
  onSuccess,
}: FormularioTipoDocumentoProps) {
  const esEdicion = !!tipoDocumento;
  const { actualizarTipoDocumento, cargando: actualizando } = useActualizarTipoDocumento();
  const { crearTipoDocumento, cargando: creando } = useCrearTipoDocumento();
  const guardando = actualizando || creando;

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario - Datos generales
  const [codigo, setCodigo] = useState(tipoDocumento?.codigo || '');
  const [nombre, setNombre] = useState(tipoDocumento?.nombre || '');
  const [descripcion, setDescripcion] = useState(tipoDocumento?.descripcion || '');
  const [audiencias, setAudiencias] = useState<AudienciaDocumento[]>(tipoDocumento?.audiencias || ['TODOS']);
  const [activo, setActivo] = useState(tipoDocumento?.activo ?? true);
  const [requiereFirma, setRequiereFirma] = useState(tipoDocumento?.requiereFirma ?? false);
  const [pdfTemplateId, setPdfTemplateId] = useState<number | null>(tipoDocumento?.pdfTemplateId ?? null);
  const [templatesDisponibles, setTemplatesDisponibles] = useState<PdfTemplateResponse[]>([]);
  
  // Estado del formulario - Fechas de vencimiento
  const [fechaLimiteFormulario, setFechaLimiteFormulario] = useState<string>(
    tipoDocumento?.fechaLimiteFormulario || ''
  );
  const [fechaLimiteEntregaFisica, setFechaLimiteEntregaFisica] = useState<string>(
    tipoDocumento?.fechaLimiteEntregaFisica || ''
  );
  const [crearEventoCalendario, setCrearEventoCalendario] = useState(
    tipoDocumento?.crearEventoCalendario ?? true
  );

  // Cargar templates disponibles
  useEffect(() => {
    pdfTemplatesService.listar().then(setTemplatesDisponibles).catch(console.error);
  }, []);

  // Estado del formulario - Campos
  const [campos, setCampos] = useState<CampoRequest[]>(() =>
    tipoDocumento?.campos.map((c, i) => ({
      codigo: c.codigo,
      etiqueta: c.etiqueta,
      placeholder: c.placeholder,
      tipoCampo: c.tipoCampo,
      opciones: c.opciones || [],
      seccion: c.seccion,
      obligatorio: c.obligatorio,
      ordenVisualizacion: c.ordenVisualizacion ?? i,
      campoPadreCodigo: c.campoPadreCodigo,
      campoPadreValor: c.campoPadreValor,
    })) || []
  );

  // Estado del formulario - Adjuntos
  const [adjuntos, setAdjuntos] = useState<AdjuntoRequest[]>(() =>
    tipoDocumento?.adjuntosRequeridos.map((a, i) => ({
      codigo: a.codigo,
      nombre: a.nombre,
      descripcion: a.descripcion,
      obligatorio: a.obligatorio,
      requiereEntregaFisica: a.requiereEntregaFisica,
      tiposPermitidos: a.tiposPermitidos,
      maxSizeMB: a.maxSizeMB,
      ordenVisualizacion: a.ordenVisualizacion ?? i,
    })) || []
  );

  const validarDatosGenerales = () => {
    if (!codigo.trim()) {
      setError('El código es requerido');
      setActiveTab('general');
      return false;
    }

    if (!nombre.trim()) {
      setError('El nombre es requerido');
      setActiveTab('general');
      return false;
    }

    if (audiencias.length === 0) {
      setError('Selecciona al menos una audiencia');
      setActiveTab('general');
      return false;
    }

    return true;
  };

  const generalCompleto = Boolean(codigo.trim()) && Boolean(nombre.trim()) && audiencias.length > 0;

  const pasosCreacion: Array<{ id: TabId; label: string; summary: string }> = [
    {
      id: 'general' as const,
      label: 'General',
      summary: generalCompleto
        ? `${audiencias.length} ${audiencias.length === 1 ? 'audiencia' : 'audiencias'}`
        : 'Código, nombre y audiencia',
    },
    {
      id: 'campos' as const,
      label: 'Campos',
      summary: `${campos.length} ${campos.length === 1 ? 'campo' : 'campos'}`,
    },
    {
      id: 'adjuntos' as const,
      label: 'Adjuntos',
      summary: `${adjuntos.length} ${adjuntos.length === 1 ? 'adjunto' : 'adjuntos'}`,
    },
  ];

  const irAPaso = (nextTab: TabId) => {
    setError(null);
    setActiveTab(nextTab);
  };

  const handleGuardar = async () => {
    setError(null);

    if (!validarDatosGenerales()) {
      return;
    }

    const request = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      audiencias,
      activo,
      requiereFirma,
      ordenVisualizacion: tipoDocumento?.ordenVisualizacion ?? 1,
      campos: campos.map((c, i) => ({ ...c, ordenVisualizacion: i })),
      adjuntos: adjuntos.map((a, i) => ({ ...a, ordenVisualizacion: i })),
      pdfTemplateId: pdfTemplateId || null,
      fechaLimiteFormulario: fechaLimiteFormulario || null,
      fechaLimiteEntregaFisica: fechaLimiteEntregaFisica || null,
      crearEventoCalendario,
    };

    try {
      if (esEdicion && tipoDocumento) {
        await actualizarTipoDocumento({ id: tipoDocumento.id, request });
      } else {
        await crearTipoDocumento(request);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error al guardar tipo de documento:', err);
      setError('Error al guardar. Por favor intenta de nuevo.');
    }
  };

  // Funciones para manejar campos
  const agregarCampo = () => {
    const nuevoCodigo = `campo_${Date.now()}`;
    setCampos([
      ...campos,
      {
        codigo: nuevoCodigo,
        etiqueta: 'Nuevo campo',
        tipoCampo: 'TEXTO',
        obligatorio: false,
        ordenVisualizacion: campos.length,
      },
    ]);
  };

  const actualizarCampo = (index: number, updates: Partial<CampoRequest>) => {
    setCampos(campos.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  const eliminarCampo = (index: number) => {
    setCampos(campos.filter((_, i) => i !== index));
  };

  const moverCampo = (index: number, direccion: 'arriba' | 'abajo') => {
    if (direccion === 'arriba' && index === 0) return;
    if (direccion === 'abajo' && index === campos.length - 1) return;

    const nuevosCampos = [...campos];
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    [nuevosCampos[index], nuevosCampos[targetIndex]] = [nuevosCampos[targetIndex], nuevosCampos[index]];
    setCampos(nuevosCampos);
  };

  // Funciones para manejar adjuntos
  const agregarAdjunto = () => {
    const nuevoCodigo = `adjunto_${Date.now()}`;
    setAdjuntos([
      ...adjuntos,
      {
        codigo: nuevoCodigo,
        nombre: 'Nuevo adjunto',
        obligatorio: true,
        requiereEntregaFisica: false,
        tiposPermitidos: 'image/*,application/pdf',
        maxSizeMB: 10,
        ordenVisualizacion: adjuntos.length,
      },
    ]);
  };

  const actualizarAdjunto = (index: number, updates: Partial<AdjuntoRequest>) => {
    setAdjuntos(adjuntos.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const eliminarAdjunto = (index: number) => {
    setAdjuntos(adjuntos.filter((_, i) => i !== index));
  };

  // Obtener secciones únicas para selector
  const seccionesUnicas = Array.from(new Set(campos.map((c) => c.seccion).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 sm:p-4">
      <div className="flex h-[100dvh] w-full flex-col bg-white sm:mx-auto sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl sm:shadow-2xl">
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                {esEdicion ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {esEdicion ? tipoDocumento?.codigo : 'Configurá datos generales, campos y adjuntos requeridos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-white/60"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="border-t border-orange-100 bg-white/90 px-2 backdrop-blur sm:px-6">
            <div className="flex">
              <button
                type="button"
                onClick={() => irAPaso('general')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:justify-start sm:px-4',
                  activeTab === 'general'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Settings className="w-4 h-4" />
                General
              </button>
              <button
                type="button"
                onClick={() => irAPaso('campos')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:justify-start sm:px-4',
                  activeTab === 'campos'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <FileText className="w-4 h-4" />
                Campos
                <span className="text-xs text-gray-400">({campos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => irAPaso('adjuntos')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:justify-start sm:px-4',
                  activeTab === 'adjuntos'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Paperclip className="w-4 h-4" />
                Adjuntos
                <span className="text-xs text-gray-400">({adjuntos.length})</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="shrink-0 px-4 pt-4 sm:px-6">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {activeTab === 'general' && (
            <TabGeneral
              codigo={codigo}
              setCodigo={setCodigo}
              nombre={nombre}
              setNombre={setNombre}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              audiencias={audiencias}
              setAudiencias={setAudiencias}
              activo={activo}
              setActivo={setActivo}
              requiereFirma={requiereFirma}
              setRequiereFirma={setRequiereFirma}
              esEdicion={esEdicion}
              mostrarIntroCreacion={!esEdicion}
              pasosCreacion={pasosCreacion}
              irAPaso={irAPaso}
              pdfTemplateId={pdfTemplateId}
              setPdfTemplateId={setPdfTemplateId}
              templatesDisponibles={templatesDisponibles}
              fechaLimiteFormulario={fechaLimiteFormulario}
              setFechaLimiteFormulario={setFechaLimiteFormulario}
              fechaLimiteEntregaFisica={fechaLimiteEntregaFisica}
              setFechaLimiteEntregaFisica={setFechaLimiteEntregaFisica}
              crearEventoCalendario={crearEventoCalendario}
              setCrearEventoCalendario={setCrearEventoCalendario}
            />
          )}

          {activeTab === 'campos' && (
            <TabCampos
              campos={campos}
              seccionesUnicas={seccionesUnicas as string[]}
              onAgregar={agregarCampo}
              onActualizar={actualizarCampo}
              onEliminar={eliminarCampo}
              onMover={moverCampo}
            />
          )}

          {activeTab === 'adjuntos' && (
            <TabAdjuntos
              adjuntos={adjuntos}
              onAgregar={agregarAdjunto}
              onActualizar={actualizarAdjunto}
              onEliminar={eliminarAdjunto}
            />
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void handleGuardar()}
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {esEdicion ? 'Guardar cambios' : 'Crear tipo de documento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tab: Datos Generales
// ============================================

interface TabGeneralProps {
  codigo: string;
  setCodigo: (v: string) => void;
  nombre: string;
  setNombre: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  audiencias: AudienciaDocumento[];
  setAudiencias: (v: AudienciaDocumento[]) => void;
  activo: boolean;
  setActivo: (v: boolean) => void;
  requiereFirma: boolean;
  setRequiereFirma: (v: boolean) => void;
  esEdicion: boolean;
  mostrarIntroCreacion: boolean;
  pasosCreacion: Array<{
    id: TabId;
    label: string;
    summary: string;
  }>;
  irAPaso: (tab: TabId) => void;
  pdfTemplateId: number | null;
  setPdfTemplateId: (v: number | null) => void;
  templatesDisponibles: PdfTemplateResponse[];
  // Fechas de vencimiento
  fechaLimiteFormulario: string;
  setFechaLimiteFormulario: (v: string) => void;
  fechaLimiteEntregaFisica: string;
  setFechaLimiteEntregaFisica: (v: string) => void;
  crearEventoCalendario: boolean;
  setCrearEventoCalendario: (v: boolean) => void;
}

function TabGeneral({
  codigo,
  setCodigo,
  nombre,
  setNombre,
  descripcion,
  setDescripcion,
  audiencias,
  setAudiencias,
  activo,
  setActivo,
  requiereFirma,
  setRequiereFirma,
  esEdicion,
  mostrarIntroCreacion,
  pasosCreacion,
  irAPaso,
  pdfTemplateId,
  setPdfTemplateId,
  templatesDisponibles,
  fechaLimiteFormulario,
  setFechaLimiteFormulario,
  fechaLimiteEntregaFisica,
  setFechaLimiteEntregaFisica,
  crearEventoCalendario,
  setCrearEventoCalendario,
}: TabGeneralProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      {mostrarIntroCreacion && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Paso actual
              </p>
              <p className="text-sm font-medium text-gray-800">
                General. Después seguís con Campos y Adjuntos.
              </p>
            </div>
            <span className="inline-flex shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
              1 de 3
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {pasosCreacion.map((paso, index) => {
              const isActive = index === 0;

              return (
                <button
                  key={paso.id}
                  type="button"
                  onClick={() => irAPaso(paso.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    isActive
                      ? 'border-orange-300 bg-white text-orange-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/60'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        isActive
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600'
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={cn('truncate text-sm font-semibold', isActive ? 'text-orange-900' : 'text-gray-900')}>
                        {paso.label}
                      </p>
                    </div>
                  </div>

                  <p className={cn('mt-1 truncate text-[11px]', isActive ? 'text-orange-700' : 'text-gray-500')}>
                    {paso.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, '_'))}
            disabled={esEdicion}
            placeholder="FICHA_MEDICA"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          {esEdicion && (
            <p className="text-xs text-gray-400 mt-1">El código no se puede modificar</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ficha Médica"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción del documento..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Quién debe completar este documento?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AUDIENCIAS.map((a) => {
              const isSelected = audiencias.includes(a.value);
              const colorClasses = {
                purple: isSelected ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50',
                teal: isSelected ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200' : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/50',
                amber: isSelected ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/50',
                blue: isSelected ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50',
              }[a.color] || '';
              
              const textColor = {
                purple: isSelected ? 'text-purple-700' : 'text-gray-600',
                teal: isSelected ? 'text-teal-700' : 'text-gray-600',
                amber: isSelected ? 'text-amber-700' : 'text-gray-600',
                blue: isSelected ? 'text-blue-700' : 'text-gray-600',
              }[a.color] || '';
              
              return (
                <button 
                  key={a.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setAudiencias(audiencias.filter(x => x !== a.value));
                    } else {
                      setAudiencias([...audiencias, a.value]);
                    }
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${colorClasses}`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className={`text-sm font-medium ${textColor}`}>{a.label}</span>
                  {isSelected && (
                    <span className={`text-xs ${textColor} opacity-75`}>✓ Seleccionado</span>
                  )}
                </button>
              );
            })}
          </div>
          {audiencias.length === 0 && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <span>⚠️</span> Selecciona al menos una audiencia
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Activo</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={requiereFirma}
              onChange={(e) => setRequiereFirma(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Requiere firma</span>
          </label>
        </div>
      </div>

      {/* Selector de Template PDF */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <FilePen className="w-4 h-4 inline mr-1" />
          Template PDF
        </label>
        <select
          value={pdfTemplateId ?? ''}
          onChange={(e) => setPdfTemplateId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Sin template</option>
          {templatesDisponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} ({t.codigo})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Opcional: asociar un template para generar PDFs pre-llenados</p>
      </div>

      {/* Fechas de Vencimiento */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Fechas de Vencimiento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha límite para formulario
            </label>
            <input
              type="date"
              value={fechaLimiteFormulario}
              onChange={(e) => setFechaLimiteFormulario(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Fecha límite para completar el formulario digital</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha límite para entrega física
            </label>
            <input
              type="date"
              value={fechaLimiteEntregaFisica}
              onChange={(e) => setFechaLimiteEntregaFisica(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Fecha límite para entregar documentos físicos</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={crearEventoCalendario}
              onChange={(e) => setCrearEventoCalendario(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
            <div>
              <span className="text-sm text-gray-700">Crear eventos en calendario</span>
              <p className="text-xs text-gray-400">Los vencimientos aparecerán automáticamente en el calendario de la comunidad</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tab: Campos
// ============================================

interface TabCamposProps {
  campos: CampoRequest[];
  seccionesUnicas: string[];
  onAgregar: () => void;
  onActualizar: (index: number, updates: Partial<CampoRequest>) => void;
  onEliminar: (index: number) => void;
  onMover: (index: number, direccion: 'arriba' | 'abajo') => void;
}

function TabCampos({
  campos,
  seccionesUnicas,
  onAgregar,
  onActualizar,
  onEliminar,
  onMover,
}: TabCamposProps) {
  const [campoExpandido, setCampoExpandido] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-gray-500">
          Define los campos que el usuario debe completar en este documento.
        </p>
        <button
          type="button"
          onClick={onAgregar}
          className="flex items-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2 text-sm text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          Agregar campo
        </button>
      </div>

      {campos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay campos configurados</p>
          <button
            onClick={onAgregar}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Agregar el primer campo
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {campos.map((campo, index) => (
            <CampoEditor
              key={index}
              campo={campo}
              index={index}
              total={campos.length}
              isExpanded={campoExpandido === index}
              onToggle={() => setCampoExpandido(campoExpandido === index ? null : index)}
              seccionesUnicas={seccionesUnicas}
              todosCampos={campos}
              onActualizar={(updates) => onActualizar(index, updates)}
              onEliminar={() => onEliminar(index)}
              onMover={(dir) => onMover(index, dir)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CampoEditorProps {
  campo: CampoRequest;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  seccionesUnicas: string[];
  todosCampos: CampoRequest[];
  onActualizar: (updates: Partial<CampoRequest>) => void;
  onEliminar: () => void;
  onMover: (direccion: 'arriba' | 'abajo') => void;
}

function CampoEditor({
  campo,
  index,
  total,
  isExpanded,
  onToggle,
  seccionesUnicas,
  todosCampos,
  onActualizar,
  onEliminar,
  onMover,
}: CampoEditorProps) {
  const [nuevaSeccion, setNuevaSeccion] = useState('');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-gray-50">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onMover('arriba')}
            disabled={index === 0}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMover('abajo')}
            disabled={index === total - 1}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{campo.etiqueta}</span>
              <span className="text-xs text-gray-400 uppercase">{campo.tipoCampo}</span>
              {campo.obligatorio && (
                <span className="w-2 h-2 rounded-full bg-red-500" title="Obligatorio" />
              )}
            </div>
            <div className="text-xs text-gray-500">
              {campo.seccion || 'Sin sección'} • {campo.codigo}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <button
          onClick={onEliminar}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar campo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Editor expandido */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input
                type="text"
                value={campo.codigo}
                onChange={(e) => onActualizar({ codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Etiqueta</label>
              <input
                type="text"
                value={campo.etiqueta}
                onChange={(e) => onActualizar({ etiqueta: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de campo</label>
              <select
                value={campo.tipoCampo}
                onChange={(e) => onActualizar({ tipoCampo: e.target.value as TipoCampo })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
              >
                {TIPOS_CAMPO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sección</label>
              <div className="flex gap-2">
                <select
                  value={campo.seccion || ''}
                  onChange={(e) => onActualizar({ seccion: e.target.value || null })}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sin sección</option>
                  {seccionesUnicas.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={nuevaSeccion}
                  onChange={(e) => setNuevaSeccion(e.target.value)}
                  onBlur={() => {
                    if (nuevaSeccion.trim()) {
                      onActualizar({ seccion: nuevaSeccion.trim() });
                      setNuevaSeccion('');
                    }
                  }}
                  placeholder="Nueva..."
                  className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Opciones para SELECCION y RADIO */}
          {(campo.tipoCampo === 'SELECCION' || campo.tipoCampo === 'RADIO') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Opciones (una por línea)
              </label>
              <textarea
                value={(campo.opciones || []).join('\n')}
                onChange={(e) => onActualizar({ opciones: e.target.value.split('\n').filter((o) => o.trim()) })}
                rows={3}
                placeholder="Sí&#10;No"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Campo condicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mostrar si campo igual a... (código del campo padre)
              </label>
              <select
                value={campo.campoPadreCodigo || ''}
                onChange={(e) => onActualizar({ campoPadreCodigo: e.target.value || null })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Siempre visible</option>
                {todosCampos
                  .filter((c) => c.codigo !== campo.codigo)
                  .map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.etiqueta}
                    </option>
                  ))}
              </select>
            </div>
            {campo.campoPadreCodigo && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor requerido</label>
                <input
                  type="text"
                  value={campo.campoPadreValor || ''}
                  onChange={(e) => onActualizar({ campoPadreValor: e.target.value })}
                  placeholder="Sí"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={campo.obligatorio || false}
                onChange={(e) => onActualizar({ obligatorio: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Obligatorio</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Tab: Adjuntos
// ============================================

interface TabAdjuntosProps {
  adjuntos: AdjuntoRequest[];
  onAgregar: () => void;
  onActualizar: (index: number, updates: Partial<AdjuntoRequest>) => void;
  onEliminar: (index: number) => void;
}

function TabAdjuntos({
  adjuntos,
  onAgregar,
  onActualizar,
  onEliminar,
}: TabAdjuntosProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-gray-500">
          Define los archivos que el usuario debe adjuntar.
        </p>
        <button
          type="button"
          onClick={onAgregar}
          className="flex items-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2 text-sm text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          Agregar adjunto
        </button>
      </div>

      {adjuntos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay adjuntos requeridos</p>
          <button
            onClick={onAgregar}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Agregar el primer adjunto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {adjuntos.map((adjunto, index) => (
            <AdjuntoEditor
              key={index}
              adjunto={adjunto}
              onActualizar={(updates) => onActualizar(index, updates)}
              onEliminar={() => onEliminar(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AdjuntoEditorProps {
  adjunto: AdjuntoRequest;
  onActualizar: (updates: Partial<AdjuntoRequest>) => void;
  onEliminar: () => void;
}

function AdjuntoEditor({ adjunto, onActualizar, onEliminar }: AdjuntoEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
            <input
              type="text"
              value={adjunto.codigo}
              onChange={(e) => onActualizar({ codigo: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={adjunto.nombre}
              onChange={(e) => onActualizar({ nombre: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <button
          onClick={onEliminar}
          className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar adjunto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
        <input
          type="text"
          value={adjunto.descripcion || ''}
          onChange={(e) => onActualizar({ descripcion: e.target.value || null })}
          placeholder="Instrucciones para el usuario..."
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipos permitidos</label>
          <input
            type="text"
            value={adjunto.tiposPermitidos || ''}
            onChange={(e) => onActualizar({ tiposPermitidos: e.target.value || null })}
            placeholder="image/*,application/pdf"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño máximo (MB)</label>
          <input
            type="number"
            value={adjunto.maxSizeMB || 10}
            onChange={(e) => onActualizar({ maxSizeMB: parseInt(e.target.value) || 10 })}
            min={1}
            max={50}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={adjunto.obligatorio || false}
            onChange={(e) => onActualizar({ obligatorio: e.target.checked })}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">Obligatorio</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={adjunto.requiereEntregaFisica || false}
            onChange={(e) => onActualizar({ requiereEntregaFisica: e.target.checked })}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">Requiere entrega física</span>
        </label>
      </div>
    </div>
  );
}

export default FormularioTipoDocumento;
