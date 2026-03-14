/**
 * FormularioDocumento Component
 *
 * Formulario dinámico para completar un documento.
 * Renderiza campos según la configuración del TipoDocumento.
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Save, Check, Upload, ChevronLeft, AlertCircle, Loader2, Clock } from 'lucide-react';
import { useDocumento, useTipoDocumento, useGuardarDocumento, useSubirAdjunto } from '../../hooks/useDocumentos';
import type { CampoFormulario, AdjuntoRequerido, ArchivoAdjunto } from '../../api/schemas/documentos';

interface FormularioDocumentoProps {
  tipoDocumentoId: number;
  keycloakId: string;
  usuarioId: number;
  onClose: () => void;
  onComplete?: () => void;
}

export function FormularioDocumento({
  tipoDocumentoId,
  keycloakId,
  usuarioId,
  onClose,
  onComplete,
}: FormularioDocumentoProps) {
  const { tipo, cargando: cargandoTipo } = useTipoDocumento(tipoDocumentoId);
  const { documento, cargando: cargandoDoc } = useDocumento(tipoDocumentoId, keycloakId);
  const { guardarDocumento, cargando: guardando } = useGuardarDocumento();
  const { subirAdjunto, cargando: subiendo } = useSubirAdjunto();

  // Estado local del formulario
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Record<number, File>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Inicializar respuestas cuando carga el documento
  useEffect(() => {
    if (documento?.respuestas) {
      setRespuestas(documento.respuestas);
    }
  }, [documento]);

  // Agrupar campos por sección
  const camposPorSeccion = useMemo(() => {
    if (!tipo?.campos) return new Map<string, CampoFormulario[]>();
    
    const map = new Map<string, CampoFormulario[]>();
    tipo.campos.forEach((campo) => {
      const seccion = campo.seccion || 'General';
      if (!map.has(seccion)) {
        map.set(seccion, []);
      }
      map.get(seccion)!.push(campo);
    });
    return map;
  }, [tipo?.campos]);

  // Verificar si un campo condicional debe mostrarse
  const debeMostrarCampo = (campo: CampoFormulario): boolean => {
    if (!campo.campoPadreCodigo) return true;
    return respuestas[campo.campoPadreCodigo] === campo.campoPadreValor;
  };

  // Actualizar respuesta
  const handleRespuesta = (codigo: string, valor: string) => {
    setRespuestas(prev => ({ ...prev, [codigo]: valor }));
    if (errores[codigo]) {
      setErrores(prev => {
        const updated = { ...prev };
        delete updated[codigo];
        return updated;
      });
    }
  };

  // Validar formulario
  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    
    tipo?.campos.forEach((campo) => {
      if (campo.obligatorio && debeMostrarCampo(campo)) {
        const valor = respuestas[campo.codigo];
        if (!valor || valor.trim() === '') {
          nuevosErrores[campo.codigo] = 'Este campo es obligatorio';
        }
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar como borrador
  const handleGuardarBorrador = async () => {
    try {
      await guardarDocumento({
        tipoDocumentoId,
        usuarioId,
        usuarioKeycloakId: keycloakId,
        respuestas,
        finalizar: false,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar borrador:', error);
    }
  };

  // Completar documento
  const handleCompletar = async () => {
    if (!validar()) return;

    try {
      await guardarDocumento({
        tipoDocumentoId,
        usuarioId,
        usuarioKeycloakId: keycloakId,
        respuestas,
        finalizar: true,
      });
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Error al completar documento:', error);
    }
  };

  // Subir archivo
  const handleSubirArchivo = async (adjuntoRequeridoId: number, file: File) => {
    if (!documento?.id) {
      // Primero guardar como borrador para tener un ID
      await guardarDocumento({
        tipoDocumentoId,
        usuarioId,
        usuarioKeycloakId: keycloakId,
        respuestas,
        finalizar: false,
      });
    }

    if (documento?.id) {
      await subirAdjunto({
        documentoId: documento.id,
        adjuntoRequeridoId,
        file,
        usuarioKeycloakId: keycloakId,
      });
    }
  };

  if (cargandoTipo || cargandoDoc) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (!tipo) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-red-500">
          Error: Tipo de documento no encontrado
        </div>
      </div>
    );
  }

  const secciones = Array.from(camposPorSeccion.entries());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tipo.nombre}</h2>
              {tipo.descripcion && (
                <p className="text-sm text-gray-500">{tipo.descripcion}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Campos por sección */}
          {secciones.map(([seccion, campos]) => (
            <div key={seccion}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {seccion}
              </h3>
              <div className="space-y-4">
                {campos.map((campo) => {
                  if (!debeMostrarCampo(campo)) return null;
                  return (
                    <CampoInput
                      key={campo.id}
                      campo={campo}
                      valor={respuestas[campo.codigo] || ''}
                      onChange={(valor) => handleRespuesta(campo.codigo, valor)}
                      error={errores[campo.codigo]}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Adjuntos requeridos */}
          {tipo.adjuntosRequeridos && tipo.adjuntosRequeridos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Documentos a adjuntar
              </h3>
              <div className="space-y-3">
                {tipo.adjuntosRequeridos.map((adjunto) => (
                  <AdjuntoInput
                    key={adjunto.id}
                    adjunto={adjunto}
                    archivoSubido={documento?.archivosAdjuntos?.find(
                      (a) => a.adjuntoCodigo === adjunto.codigo
                    )}
                    archivoSeleccionado={archivosSeleccionados[adjunto.id]}
                    onSelectFile={(file) => {
                      setArchivosSeleccionados((prev) => ({ ...prev, [adjunto.id]: file }));
                      handleSubirArchivo(adjunto.id, file);
                    }}
                    subiendo={subiendo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleGuardarBorrador}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar borrador
          </button>
          <button
            onClick={handleCompletar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {guardando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Completar documento
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Componentes auxiliares
// ============================================

interface CampoInputProps {
  campo: CampoFormulario;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
}

function CampoInput({ campo, valor, onChange, error }: CampoInputProps) {
  const baseClassName = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`;

  const renderInput = () => {
    switch (campo.tipoCampo) {
      case 'TEXTAREA':
        return (
          <textarea
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder || ''}
            rows={3}
            className={baseClassName}
          />
        );

      case 'SELECCION':
        const opciones = campo.opciones || [];
        return (
          <select
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
          >
            <option value="">Seleccionar...</option>
            {opciones.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'RADIO':
        const radioOpciones = campo.opciones?.length ? campo.opciones : ['Sí', 'No'];
        return (
          <div className="flex gap-4">
            {radioOpciones.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={campo.codigo}
                  value={opt}
                  checked={valor === opt}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'NUMERO':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder || ''}
            className={baseClassName}
          />
        );

      case 'FECHA':
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className={baseClassName}
          />
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder || 'email@ejemplo.com'}
            className={baseClassName}
          />
        );

      case 'TELEFONO':
        return (
          <input
            type="tel"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder || '+54 ...'}
            className={baseClassName}
          />
        );

      case 'BOOLEAN':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={valor === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Sí</span>
          </label>
        );

      default: // TEXTO
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder || ''}
            className={baseClassName}
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {campo.etiqueta}
        {campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface AdjuntoInputProps {
  adjunto: AdjuntoRequerido;
  archivoSubido?: ArchivoAdjunto;
  archivoSeleccionado?: File;
  onSelectFile: (file: File) => void;
  subiendo: boolean;
}

function AdjuntoInput({ adjunto, archivoSubido, archivoSeleccionado, onSelectFile, subiendo }: AdjuntoInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const tieneArchivo = archivoSubido || archivoSeleccionado;

  return (
    <div className={`border rounded-lg p-4 ${tieneArchivo ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {adjunto.nombre}
            {adjunto.obligatorio && <span className="text-red-500 ml-1">*</span>}
          </h4>
          {adjunto.descripcion && (
            <p className="text-sm text-gray-500 mt-1">{adjunto.descripcion}</p>
          )}
          {adjunto.requiereEntregaFisica && (
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Requiere entrega física del original
              </p>
              {archivoSubido && (
                <p className={`text-xs flex items-center gap-1 ${archivoSubido.entregadoFisicamente ? 'text-green-600' : 'text-orange-500 font-medium'}`}>
                  {archivoSubido.entregadoFisicamente ? (
                    <><Check className="w-3 h-3" /> Entregado físicamente</>
                  ) : (
                    <><Clock className="w-3 h-3" /> Pendiente de entrega física</>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tieneArchivo ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {archivoSubido ? 'Subido (Digital)' : 'Seleccionado'}
                </span>
              </div>
              {archivoSubido && (
                <span className="text-[10px] text-gray-500">
                  {archivoSubido.nombreArchivo}
                </span>
              )}
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
              {subiendo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="text-sm">Subir archivo</span>
              <input
                type="file"
                accept={adjunto.tiposPermitidos || 'image/*,application/pdf'}
                onChange={handleFileChange}
                className="hidden"
                disabled={subiendo}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormularioDocumento;
