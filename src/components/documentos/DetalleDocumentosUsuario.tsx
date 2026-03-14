/**
 * DetalleDocumentosUsuario Component
 *
 * Modal para que dirigentes/secretario vean los documentos de un usuario específico.
 * Muestra lista de documentos con estados, respuestas y adjuntos.
 */

import { useState } from 'react';
import { X, FileText, Check, Clock, AlertCircle, AlertTriangle, Upload, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useDetalleDocumentosUsuario, useTipoDocumento, useMarcarEntregaFisica, useObservarDocumento } from '../../hooks/useDocumentos';
import { documentosService } from '../../api/services/documentos';
import { ESTADO_CONFIG, type DocumentoCompletado, type ArchivoAdjunto } from '../../api/schemas/documentos';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface DetalleDocumentosUsuarioProps {
  usuarioId: number;
  usuarioNombre?: string;
  onClose: () => void;
}

export function DetalleDocumentosUsuario({
  usuarioId,
  usuarioNombre,
  onClose,
}: DetalleDocumentosUsuarioProps) {
  const { documentos, cargando, error } = useDetalleDocumentosUsuario(usuarioId);
  const { hasRole } = useAuth();
  const puedeObservar = hasRole('SECRETARIO') || hasRole('DIRIGENTE') || hasRole('ADMIN');
  const { observarDocumento, cargando: observandoDocumento } = useObservarDocumento();

  const [documentoParaObservar, setDocumentoParaObservar] = useState<DocumentoCompletado | null>(null);
  const [textoObservacion, setTextoObservacion] = useState('');

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-red-500">
          Error al cargar documentos
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const stats = {
    total: documentos.length,
    completos: documentos.filter(d => d.estado === 'COMPLETO' || d.estado === 'PENDIENTE_FISICO').length,
    pendientes: documentos.filter(d => d.estado === 'BORRADOR' || d.estado === 'PENDIENTE_ADJUNTOS' || d.estado === 'OBSERVADO').length,
    sinIniciar: documentos.filter(d => d.estado === null).length,
  };

  const porcentaje = stats.total > 0 ? Math.round((stats.completos / stats.total) * 100) : 0;

  const abrirModalObservacion = (documento: DocumentoCompletado) => {
    setDocumentoParaObservar(documento);
    setTextoObservacion(documento.observacionRevision ?? '');
  };

  const cerrarModalObservacion = () => {
    setDocumentoParaObservar(null);
    setTextoObservacion('');
  };

  const confirmarObservacion = async () => {
    const observacion = textoObservacion.trim();
    if (!documentoParaObservar?.id) {
      toast.error('No se puede observar un documento sin iniciar');
      return;
    }

    if (!observacion) {
      toast.error('La aclaración es obligatoria');
      return;
    }

    try {
      await observarDocumento({
        documentoId: documentoParaObservar.id,
        request: { observacion },
      });

      toast.success('Observación registrada', {
        description: 'El usuario verá este issue al ingresar al inicio y en Documentos.',
      });
      cerrarModalObservacion();
    } catch (e) {
      console.error('Error observando documento', e);
      toast.error('No se pudo registrar la observación');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <Dialog open={!!documentoParaObservar} onOpenChange={(open) => !open && cerrarModalObservacion()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar documento con issue</DialogTitle>
              <DialogDescription>
                Esta aclaración se mostrará al usuario para que vuelva a subir/corregir el documento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Documento: {documentoParaObservar?.tipoDocumentoNombre}
              </p>
              <Textarea
                value={textoObservacion}
                onChange={(e) => setTextoObservacion(e.target.value)}
                placeholder="Ej: La imagen del DNI está borrosa. Volvé a subirla completa, legible y con ambos lados."
                rows={5}
                maxLength={1200}
              />
              <p className="text-xs text-gray-500 text-right">{textoObservacion.length}/1200</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModalObservacion} disabled={observandoDocumento}>
                Cancelar
              </Button>
              <Button type="button" onClick={confirmarObservacion} disabled={observandoDocumento}>
                {observandoDocumento ? 'Guardando...' : 'Guardar observación'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Documentos de {usuarioNombre || `Usuario #${usuarioId}`}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{stats.completos}/{stats.total} completos</span>
              <span className="font-semibold text-blue-600">{porcentaje}%</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {documentos.map((doc) => (
            <DocumentoCard
              key={doc.tipoDocumentoId}
              documento={doc}
              puedeObservar={puedeObservar}
              onSolicitarObservacion={abrirModalObservacion}
            />
          ))}

          {documentos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay documentos aplicables para este usuario
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Componentes auxiliares
// ============================================

interface DocumentoCardProps {
  documento: DocumentoCompletado;
  puedeObservar: boolean;
  onSolicitarObservacion: (documento: DocumentoCompletado) => void;
}

function DocumentoCard({ documento, puedeObservar, onSolicitarObservacion }: DocumentoCardProps) {
  const [expandido, setExpandido] = useState(false);
  const estado = documento.estado;
  const config = estado ? ESTADO_CONFIG[estado] : null;

  const getIcon = () => {
    if (!estado) return <FileText className="w-5 h-5 text-gray-400" />;
    switch (estado) {
      case 'COMPLETO':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'PENDIENTE_FISICO':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'PENDIENTE_ADJUNTOS':
        return <Upload className="w-5 h-5 text-yellow-500" />;
      case 'BORRADOR':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'OBSERVADO':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    if (!estado) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          Sin iniciar
        </span>
      );
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config?.bgColor} ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const tieneContenido = estado && (
    Object.keys(documento.respuestas || {}).length > 0 ||
    (documento.archivosAdjuntos || []).length > 0
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header del documento */}
      <button
        onClick={() => tieneContenido && setExpandido(!expandido)}
        className={`w-full flex items-center gap-4 p-4 text-left ${
          tieneContenido ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
        } transition-colors`}
        disabled={!tieneContenido}
      >
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{documento.tipoDocumentoNombre}</h4>
          <p className="text-sm text-gray-500">
            {documento.camposCompletados}/{documento.camposObligatorios} campos •{' '}
            {documento.adjuntosSubidos}/{documento.adjuntosRequeridos} adjuntos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {puedeObservar && documento.id !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSolicitarObservacion(documento);
              }}
              className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              title="Solicitar nueva carga con aclaración"
            >
              {documento.estado === 'OBSERVADO' ? 'Editar issue' : 'Marcar issue'}
            </button>
          )}
          {getStatusBadge()}
          {tieneContenido && (
            expandido ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {expandido && tieneContenido && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
          {documento.estado === 'OBSERVADO' && documento.observacionRevision && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">Issue de revisión</p>
              <p className="mt-1 text-sm text-red-700">{documento.observacionRevision}</p>
              {(documento.observadoPorNombre || documento.fechaObservacion) && (
                <p className="mt-2 text-xs text-red-600">
                  {documento.observadoPorNombre ? `Marcado por ${documento.observadoPorNombre}` : 'Marcado por dirigente/secretario'}
                  {documento.fechaObservacion ? ` · ${new Date(documento.fechaObservacion).toLocaleString('es-AR')}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Respuestas */}
          {Object.keys(documento.respuestas || {}).length > 0 && (
            <RespuestasSection documento={documento} />
          )}

          {/* Adjuntos */}
          {(documento.archivosAdjuntos || []).length > 0 && (
            <AdjuntosSection adjuntos={documento.archivosAdjuntos || []} />
          )}
        </div>
      )}
    </div>
  );
}

interface RespuestasSectionProps {
  documento: DocumentoCompletado;
}

function RespuestasSection({ documento }: RespuestasSectionProps) {
  const { tipo } = useTipoDocumento(documento.tipoDocumentoId);
  const respuestas = documento.respuestas || {};

  // Crear mapa de código -> etiqueta
  const etiquetasPorCodigo = new Map(
    tipo?.campos?.map(c => [c.codigo, c.etiqueta]) || []
  );

  return (
    <div>
      <h5 className="text-sm font-semibold text-gray-700 mb-2">Respuestas</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(respuestas).map(([codigo, valor]) => (
          <div key={codigo} className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">
              {etiquetasPorCodigo.get(codigo) || codigo}
            </div>
            <div className="text-sm text-gray-900">{valor || '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AdjuntosSectionProps {
  adjuntos: ArchivoAdjunto[];
}

function AdjuntosSection({ adjuntos }: AdjuntosSectionProps) {
  const { marcarEntregaFisica, cargando } = useMarcarEntregaFisica();

  const handleMarcarEntrega = async (archivoId: number) => {
    try {
      await marcarEntregaFisica(archivoId);
    } catch (error) {
      console.error('Error al marcar entrega física:', error);
    }
  };

  const handleVerArchivo = async (archivoId: number, nombreArchivo: string) => {
    try {
      // Descargar archivo con autenticación
      const blob = await documentosService.descargarAdjunto(archivoId);
      // Crear URL temporal y abrir en nueva pestaña
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    }
  };

  return (
    <div>
      <h5 className="text-sm font-semibold text-gray-700 mb-2">Archivos adjuntos</h5>
      <div className="space-y-2">
        {adjuntos.map((adjunto) => (
          <div
            key={adjunto.id}
            className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">{adjunto.adjuntoNombre}</div>
                <div className="text-xs text-gray-500">
                  {adjunto.nombreArchivo} • {Math.round(adjunto.tamanoBytes / 1024)} KB
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adjunto.requiereEntregaFisica && (
                adjunto.entregadoFisicamente ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Entregado
                  </span>
                ) : (
                  <button
                    onClick={() => handleMarcarEntrega(adjunto.id)}
                    disabled={cargando}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
                  >
                    {cargando ? 'Marcando...' : 'Marcar entrega'}
                  </button>
                )
              )}
              <button
                onClick={() => handleVerArchivo(adjunto.id, adjunto.nombreArchivo)}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                title="Ver archivo"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DetalleDocumentosUsuario;
