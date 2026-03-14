/**
 * MisDocumentos Component
 *
 * Muestra el checklist de documentos del usuario actual.
 * Permite ver el estado de cada documento y acceder a completarlo.
 */

import { useState } from 'react';
import { FileText, Check, Clock, AlertCircle, ChevronRight, Upload, AlertTriangle, Download } from 'lucide-react';
import { useDocumentosUsuario } from '../../hooks/useDocumentos';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { ESTADO_CONFIG, type DocumentoCompletado } from '../../api/schemas/documentos';
import { FichaMedicaPdfView } from './FichaMedicaPdfView';

interface MisDocumentosProps {
  onSelectDocumento?: (tipoDocumentoId: number, usuarioId: number) => void;
}

export function MisDocumentos({ onSelectDocumento }: MisDocumentosProps) {
  const { data: usuario } = useUsuarioActual();
  const { documentos, cargando, error } = useDocumentosUsuario(usuario?.id || 0);
  const [pdfDocumento, setPdfDocumento] = useState<DocumentoCompletado | null>(null);

  if (!usuario) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error al cargar documentos: {error.message}
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
  const documentosObservados = documentos.filter(d => d.estado === 'OBSERVADO');

  const porcentaje = stats.total > 0 ? Math.round((stats.completos / stats.total) * 100) : 0;

  const handleOpenPdf = (doc: DocumentoCompletado) => {
    if (doc.tipoDocumentoCodigo === 'FICHA_MEDICA' && doc.id !== null) {
      setPdfDocumento(doc);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de PDF */}
      {pdfDocumento && usuario && (
        <FichaMedicaPdfView
          documento={pdfDocumento}
          usuario={usuario}
          onClose={() => setPdfDocumento(null)}
        />
      )}

      {/* Resumen */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mi Documentación</h3>
            <p className="text-sm text-gray-500">
              {stats.completos} de {stats.total} documentos completos
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-orange-500">{porcentaje}%</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.completos}</div>
            <div className="text-xs text-gray-500">Completos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <div className="text-xs text-gray-500">En progreso</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">{stats.sinIniciar}</div>
            <div className="text-xs text-gray-500">Sin iniciar</div>
          </div>
        </div>
      </div>

      {/* Pendientes de entrega física */}
      {documentos.some(d => d.estado === 'PENDIENTE_FISICO') && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-orange-100 border-b border-orange-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Pendiente de Entrega Física</h3>
          </div>
          <div className="p-2 space-y-1">
            {documentos
              .filter(d => d.estado === 'PENDIENTE_FISICO')
              .flatMap(d => d.archivosAdjuntos
                .filter(a => a.requiereEntregaFisica && !a.entregadoFisicamente)
                .map(a => ({ ...a, docNombre: d.tipoDocumentoNombre, docId: d.tipoDocumentoId }))
              )
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.adjuntoNombre}</div>
                      <div className="text-xs text-gray-500">{item.docNombre}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectDocumento?.(item.docId, usuario.id)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Documentos observados por dirigente/secretario */}
      {documentosObservados.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-red-100 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700" />
            <h3 className="font-semibold text-red-900">Issues en Documentación</h3>
          </div>
          <div className="p-2 space-y-1">
            {documentosObservados.map((doc) => (
              <div key={doc.tipoDocumentoId} className="p-3 bg-white rounded-lg border border-red-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.tipoDocumentoNombre}</div>
                    <div className="text-xs text-red-700 mt-1">{doc.observacionRevision || 'Tenés una observación pendiente para corregir este documento.'}</div>
                    {(doc.observadoPorNombre || doc.fechaObservacion) && (
                      <div className="text-[11px] text-red-600 mt-1">
                        {doc.observadoPorNombre ? `Marcado por ${doc.observadoPorNombre}` : 'Marcado por dirigente/secretario'}
                        {doc.fechaObservacion ? ` · ${new Date(doc.fechaObservacion).toLocaleString('es-AR')}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectDocumento?.(doc.tipoDocumentoId, usuario.id)}
                    className="text-xs font-medium text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Corregir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {documentos.map((doc) => (
            <DocumentoItem
              key={doc.tipoDocumentoId}
              documento={doc}
              onClick={() => onSelectDocumento?.(doc.tipoDocumentoId, usuario.id)}
              onDownload={() => handleOpenPdf(doc)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DocumentoItemProps {
  documento: DocumentoCompletado;
  onClick?: () => void;
  onDownload?: () => void;
}

function DocumentoItem({ documento, onClick, onDownload }: DocumentoItemProps) {
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

  const canDownload = documento.id !== null && documento.tipoDocumentoCodigo === 'FICHA_MEDICA';

  return (
    <div className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
      <button
        onClick={onClick}
        className="flex-shrink-0"
      >
        {getIcon()}
      </button>

      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
      >
        <h4 className="font-medium text-gray-900 truncate">{documento.tipoDocumentoNombre}</h4>
        <p className="text-sm text-gray-500">
          {documento.camposCompletados}/{documento.camposObligatorios} campos •{' '}
          {documento.adjuntosSubidos}/{documento.adjuntosRequeridos} adjuntos
        </p>
      </button>

      <div className="flex items-center gap-3">
        {canDownload && (
          <button
            onClick={onDownload}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
            title="Generar PDF para firmar"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        {getStatusBadge()}
        <button onClick={onClick}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export default MisDocumentos;
