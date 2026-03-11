/**
 * GenerarPdfModal Component
 * 
 * Modal para generar PDFs desde templates asociados a tipos de documento o desde adjuntos (PDF/imagenes).
 * Permite generar PDF individual desde template o adjuntos, y PDF masivo solo desde template.
 */

import axios from 'axios';
import { useState, useEffect } from 'react';
import { X, FileDown, Loader2, FilePen, Paperclip, Users } from 'lucide-react';
import { useTiposDocumento, useTiposImprimiblesUsuario } from '../../hooks/useDocumentos';
import { pdfTemplatesService, type PdfTemplateResponse } from '../../api/services/pdfTemplates';
import { documentosService } from '../../api/services/documentos';
import { descargarPdfDesdeTemplate, descargarPdfsMasivos, type DatosCampo } from './PdfTemplateRenderer';
import type { TemplateConfig } from './PdfTemplateEditor';
import type { TipoDocumento, TipoDocumentoImprimible } from '../../api/schemas/documentos';

interface UsuarioDatos {
  id: number;
  nombreMostrar: string;
  dni?: string | null;
  fechaNacimiento?: string | null;
  localidad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email: string;
}

interface GenerarPdfModalProps {
  /** Usuario para generación individual */
  usuario?: UsuarioDatos;
  /** Múltiples usuarios para generación masiva */
  usuarios?: UsuarioDatos[];
  onClose: () => void;
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'documento';
}

function buildPdfFilename(tipoNombre: string, usuarioNombre?: string, suffix?: string) {
  const parts = [tipoNombre, usuarioNombre, suffix]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => sanitizeFilenamePart(value));

  return `${parts.join('_')}.pdf`;
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getInlineErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isNotFoundAxiosError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

async function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data instanceof Blob) {
      try {
        const text = await data.text();
        if (text.trim().startsWith('{')) {
          const parsed = JSON.parse(text) as { message?: string; error?: string; detail?: string };
          const blobMessage = parsed.message || parsed.error || parsed.detail;
          if (blobMessage?.trim()) {
            return blobMessage;
          }
        }

        if (text.trim()) {
          return text;
        }
      } catch {
        // Ignorar errores de parseo y continuar con otros fallbacks.
      }
    }

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const message = (data as { message?: string; error?: string; detail?: string }).message
        || (data as { message?: string; error?: string; detail?: string }).error
        || (data as { message?: string; error?: string; detail?: string }).detail;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function GenerarPdfModal({ usuario, usuarios, onClose }: GenerarPdfModalProps) {
  const esMasivo = !usuario && usuarios && usuarios.length > 0;
  const { tipos } = useTiposDocumento();
  const {
    tipos: tiposImprimibles,
    cargando: cargandoTiposImprimibles,
    error: errorTiposImprimibles,
  } = useTiposImprimiblesUsuario(usuario?.id ?? 0);
  
  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState<number | ''>('');
  const [template, setTemplate] = useState<PdfTemplateResponse | null>(null);
  const [cargandoTemplate, setCargandoTemplate] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tiposConTemplate: TipoDocumentoImprimible[] = (tipos || [])
    .filter((t: TipoDocumento) => Boolean(t.pdfTemplateId || t.pdfTemplateCodigo))
    .map((t: TipoDocumento) => ({
      id: t.id,
      codigo: t.codigo,
      nombre: t.nombre,
      audiencias: t.audiencias,
      pdfTemplateId: t.pdfTemplateId ?? null,
      pdfTemplateCodigo: t.pdfTemplateCodigo ?? null,
      modoImpresion: 'TEMPLATE',
    }));

  const usarFallbackTemplates = !esMasivo && isNotFoundAxiosError(errorTiposImprimibles);
  const mostrarErrorTiposImprimibles = !esMasivo && Boolean(errorTiposImprimibles) && !usarFallbackTemplates;
  const opcionesTipo = esMasivo || usarFallbackTemplates ? tiposConTemplate : tiposImprimibles;
  const tipoSeleccionado = opcionesTipo.find((tipo) => tipo.id === tipoSeleccionadoId) ?? null;
  const requiereTemplate = tipoSeleccionado?.modoImpresion === 'TEMPLATE';
  const puedeGenerar = Boolean(tipoSeleccionado)
    && !generando
    && (esMasivo ? Boolean(template) : tipoSeleccionado?.modoImpresion === 'ADJUNTOS' || Boolean(tipoSeleccionado?.pdfTemplateId || tipoSeleccionado?.pdfTemplateCodigo));

  useEffect(() => {
    if (tipoSeleccionadoId !== '' && !opcionesTipo.some((tipo) => tipo.id === tipoSeleccionadoId)) {
      setTipoSeleccionadoId('');
      setTemplate(null);
    }
  }, [opcionesTipo, tipoSeleccionadoId]);

  useEffect(() => {
    if (!esMasivo || !tipoSeleccionado?.pdfTemplateCodigo) {
      setTemplate(null);
      setCargandoTemplate(false);
      return;
    }

    let cancelled = false;

    const cargarTemplate = async () => {
      setCargandoTemplate(true);
      setError(null);
      try {
        const t = await pdfTemplatesService.getByCodigo(tipoSeleccionado.pdfTemplateCodigo!);
        if (!cancelled) {
          setTemplate(t);
        }
      } catch (err) {
        console.error('Error cargando template:', err);
        if (!cancelled) {
          setTemplate(null);
          setError(await getApiErrorMessage(err, 'No se pudo cargar el template asociado.'));
        }
      } finally {
        if (!cancelled) {
          setCargandoTemplate(false);
        }
      }
    };

    cargarTemplate();

    return () => {
      cancelled = true;
    };
  }, [esMasivo, tipoSeleccionado]);

  // Convertir usuario a datos para el template
  const usuarioToDatos = (u: UsuarioDatos): DatosCampo => ({
    usuario_dni: u.dni || '',
    usuario_nombre: u.nombreMostrar || '',
    usuario_fecha_nacimiento: u.fechaNacimiento || '',
    usuario_localidad: u.localidad || '',
    usuario_direccion: u.direccion || '',
    usuario_telefono: u.telefono || '',
    usuario_email: u.email || '',
  });

  // Convertir respuesta API a TemplateConfig
  const toTemplateConfig = (t: PdfTemplateResponse): TemplateConfig => ({
    codigo: t.codigo,
    nombre: t.nombre,
    pdfBase64: t.pdfBase64,
    pageWidth: t.pageWidth,
    pageHeight: t.pageHeight,
    campos: t.campos.map(c => ({
      codigo: c.codigo,
      nombre: c.nombre,
      x: c.x,
      y: c.y,
      fontSize: c.fontSize,
      tipo: c.tipo as 'texto' | 'checkbox' | 'fecha' | 'marker',
    })),
  });

  const handleGenerar = async () => {
    if (!tipoSeleccionado) {
      return;
    }

    setGenerando(true);
    setError(null);

    try {
      if (esMasivo && usuarios) {
        if (!template) {
          setError('Selecciona un tipo con template PDF válido para continuar.');
          return;
        }

        const templateConfig = toTemplateConfig(template);
        const datosMultiples = usuarios.map(usuarioToDatos);
        const filename = buildPdfFilename(tipoSeleccionado.nombre || 'documentos', undefined, 'masivo');
        await descargarPdfsMasivos(templateConfig, datosMultiples, filename);
      } else if (usuario) {
        if (tipoSeleccionado.modoImpresion === 'ADJUNTOS') {
          const blob = await documentosService.descargarAdjuntosPdf(tipoSeleccionado.id, usuario.id);
          descargarBlob(blob, buildPdfFilename(tipoSeleccionado.nombre, usuario.nombreMostrar, 'adjuntos'));
        } else {
          const pdfData = await documentosService.getPdfData(tipoSeleccionado.id, usuario.id);

          const templateConfig: TemplateConfig = {
            codigo: pdfData.template.codigo,
            nombre: pdfData.template.nombre,
            pdfBase64: pdfData.template.pdfBase64,
            pageWidth: pdfData.template.pageWidth,
            pageHeight: pdfData.template.pageHeight,
            campos: pdfData.template.campos.map(c => ({
              codigo: c.codigo,
              nombre: c.nombre,
              x: c.x,
              y: c.y,
              fontSize: c.fontSize,
              tipo: c.tipo as 'texto' | 'checkbox' | 'fecha' | 'marker' | 'fijo',
              valorFijo: c.valorFijo,
            })),
          };

          const filename = buildPdfFilename(tipoSeleccionado.nombre, pdfData.nombreUsuario || usuario.nombreMostrar);
          await descargarPdfDesdeTemplate(templateConfig, pdfData.datos as DatosCampo, filename);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError(
        await getApiErrorMessage(
          err,
          tipoSeleccionado.modoImpresion === 'ADJUNTOS'
            ? 'No se pudo descargar el PDF generado desde adjuntos.'
            : 'No se pudo generar el PDF.'
        )
      );
    } finally {
      setGenerando(false);
    }
  };

  const tituloEmptyState = esMasivo
    ? 'No hay templates PDF asociados'
    : usarFallbackTemplates
      ? 'No hay documentos con template disponibles'
      : 'No hay documentos imprimibles';
  const detalleEmptyState = esMasivo
    ? 'Primero asociá un template PDF desde Configuración para habilitar la impresión masiva.'
    : usarFallbackTemplates
      ? 'Este entorno todavía no expone el listado de imprimibles por usuario. Como compatibilidad, solo se muestran documentos con template PDF asociado.'
      : 'Este usuario no tiene documentos aplicables con template o adjuntos PDF disponibles para imprimir.';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 sm:p-4">
      <div className="flex h-[100dvh] w-full flex-col bg-white sm:mx-auto sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:shadow-xl">
        <div className="shrink-0 border-b border-gray-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FilePen className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold">
                {esMasivo ? 'Generar PDFs Masivo' : 'Generar PDF'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            {esMasivo ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4" />
                <span>{usuarios?.length} usuarios seleccionados</span>
              </div>
            ) : usuario && (
              <div>
                <div className="font-medium text-gray-900">{usuario.nombreMostrar}</div>
                <div className="text-sm text-gray-500">{usuario.email}</div>
              </div>
            )}
          </div>

          {!esMasivo && cargandoTiposImprimibles && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando documentos imprimibles para este usuario...
            </div>
          )}

          {usarFallbackTemplates && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Este backend todav\u00eda no expone el listado de imprimibles por usuario. Se muestran solo documentos con template PDF asociado.
            </div>
          )}

          {mostrarErrorTiposImprimibles && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {getInlineErrorMessage(errorTiposImprimibles, 'No se pudo cargar el listado de documentos imprimibles.')}
            </div>
          )}

          {(!mostrarErrorTiposImprimibles && opcionesTipo.length > 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {esMasivo ? 'Tipo de documento' : 'Documento imprimible'}
              </label>
              <select
                value={tipoSeleccionadoId}
                onChange={(e) => {
                  setError(null);
                  setTemplate(null);
                  setTipoSeleccionadoId(e.target.value ? Number(e.target.value) : '');
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Seleccionar documento...</option>
                {opcionesTipo.map((t) => (
                  <option key={t.id} value={t.id}>
                    {`${t.nombre} • ${t.modoImpresion === 'ADJUNTOS' ? 'adjuntos' : 'template'}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!cargandoTiposImprimibles && !mostrarErrorTiposImprimibles && opcionesTipo.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-gray-500">
              <p className="font-medium text-gray-700">{tituloEmptyState}</p>
              <p className="mt-1 text-sm">{detalleEmptyState}</p>
            </div>
          )}

          {cargandoTemplate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando template...
            </div>
          )}

          {esMasivo && template && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
              ✓ Template "{template.nombre}" listo para generar
            </div>
          )}

          {!esMasivo && tipoSeleccionado?.modoImpresion === 'TEMPLATE' && Boolean(tipoSeleccionado.pdfTemplateId || tipoSeleccionado.pdfTemplateCodigo) && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <FilePen className="mt-0.5 w-4 h-4 flex-shrink-0" />
                <span>Se generará un PDF prellenado con los datos y respuestas disponibles para este usuario.</span>
              </div>
            </div>
          )}

          {!esMasivo && tipoSeleccionado?.modoImpresion === 'ADJUNTOS' && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <Paperclip className="mt-0.5 w-4 h-4 flex-shrink-0" />
                <span>Se descargará un PDF compuesto a partir de los adjuntos cargados para este usuario, incluyendo PDFs e imágenes.</span>
              </div>
            </div>
          )}

          {!esMasivo && requiereTemplate && !Boolean(tipoSeleccionado?.pdfTemplateId || tipoSeleccionado?.pdfTemplateCodigo) && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Este tipo no tiene template PDF asociado. Elegí otro documento imprimible.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 p-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={!puedeGenerar}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {generando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {esMasivo ? 'Generar todos' : tipoSeleccionado?.modoImpresion === 'ADJUNTOS' ? 'Descargar PDF' : 'Generar PDF'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerarPdfModal;
