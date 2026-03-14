/**
 * Schemas de Valibot para el módulo de Documentación
 */

import {
  object,
  string,
  number,
  boolean,
  array,
  nullable,
  optional,
  record,
  picklist,
  type InferOutput
} from 'valibot';

// ============================================
// Enums
// ============================================

export const AudienciaDocumentoSchema = picklist(['ACAMPANTE', 'DIRIGENTE', 'PADRE', 'TODOS']);
export type AudienciaDocumento = InferOutput<typeof AudienciaDocumentoSchema>;

export const EstadoDocumentoSchema = picklist(['BORRADOR', 'PENDIENTE_ADJUNTOS', 'PENDIENTE_FISICO', 'COMPLETO', 'OBSERVADO']);
export type EstadoDocumento = InferOutput<typeof EstadoDocumentoSchema>;

export const TipoCampoSchema = picklist(['TEXTO', 'TEXTAREA', 'SELECCION', 'RADIO', 'BOOLEAN', 'FECHA', 'EMAIL', 'TELEFONO', 'NUMERO']);
export type TipoCampo = InferOutput<typeof TipoCampoSchema>;

export const ModoImpresionDocumentoSchema = picklist(['TEMPLATE', 'ADJUNTOS']);
export type ModoImpresionDocumento = InferOutput<typeof ModoImpresionDocumentoSchema>;

// ============================================
// Schemas de Tipos de Documento (Configuración)
// ============================================

export const CampoFormularioSchema = object({
  id: number(),
  codigo: string(),
  etiqueta: string(),
  placeholder: nullable(string()),
  tipoCampo: TipoCampoSchema,
  opciones: array(string()),
  seccion: nullable(string()),
  obligatorio: boolean(),
  ordenVisualizacion: number(),
  campoPadreCodigo: nullable(string()),
  campoPadreValor: nullable(string()),
});

export type CampoFormulario = InferOutput<typeof CampoFormularioSchema>;

export const AdjuntoRequeridoSchema = object({
  id: number(),
  codigo: string(),
  nombre: string(),
  descripcion: nullable(string()),
  obligatorio: boolean(),
  requiereEntregaFisica: boolean(),
  tiposPermitidos: string(),
  maxSizeMB: number(),
  ordenVisualizacion: number(),
});

export type AdjuntoRequerido = InferOutput<typeof AdjuntoRequeridoSchema>;

export const TipoDocumentoSchema = object({
  id: number(),
  codigo: string(),
  nombre: string(),
  descripcion: nullable(string()),
  audiencias: array(AudienciaDocumentoSchema),
  activo: boolean(),
  requiereFirma: boolean(),
  ordenVisualizacion: number(),
  campos: array(CampoFormularioSchema),
  adjuntosRequeridos: array(AdjuntoRequeridoSchema),
  // Template PDF asociado (opcional)
  pdfTemplateId: optional(nullable(number())),
  pdfTemplateCodigo: optional(nullable(string())),
  // Fechas de vencimiento
  fechaLimiteFormulario: optional(nullable(string())),
  fechaLimiteEntregaFisica: optional(nullable(string())),
  crearEventoCalendario: optional(boolean()),
});

export type TipoDocumento = InferOutput<typeof TipoDocumentoSchema>;

export const TipoDocumentoImprimibleSchema = object({
  id: number(),
  codigo: string(),
  nombre: string(),
  audiencias: array(AudienciaDocumentoSchema),
  pdfTemplateId: optional(nullable(number())),
  pdfTemplateCodigo: optional(nullable(string())),
  modoImpresion: ModoImpresionDocumentoSchema,
});

export type TipoDocumentoImprimible = InferOutput<typeof TipoDocumentoImprimibleSchema>;

// ============================================
// Schemas de Documentos Completados
// ============================================

export const ArchivoAdjuntoSchema = object({
  id: number(),
  adjuntoCodigo: string(),
  adjuntoNombre: string(),
  nombreArchivo: string(),
  mimeType: string(),
  tamanoBytes: number(),
  requiereEntregaFisica: boolean(),
  entregadoFisicamente: boolean(),
  fechaSubida: nullable(string()),
  fechaEntregaFisica: nullable(string()),
});

export type ArchivoAdjunto = InferOutput<typeof ArchivoAdjuntoSchema>;

export const DocumentoCompletadoSchema = object({
  id: nullable(number()),
  tipoDocumentoId: number(),
  tipoDocumentoCodigo: string(),
  tipoDocumentoNombre: string(),
  usuarioId: number(),
  keycloakId: optional(nullable(string())),
  usuarioNombre: nullable(string()),
  familiaId: nullable(number()),
  completadoPorId: nullable(number()),
  completadoPorNombre: nullable(string()),
  estado: nullable(EstadoDocumentoSchema),
  fechaCompletado: nullable(string()),
  fechaActualizacion: nullable(string()),
  observacionRevision: optional(nullable(string())),
  observadoPorId: optional(nullable(number())),
  observadoPorNombre: optional(nullable(string())),
  fechaObservacion: optional(nullable(string())),
  respuestas: record(string(), string()),
  archivosAdjuntos: array(ArchivoAdjuntoSchema),
  camposCompletados: number(),
  camposObligatorios: number(),
  adjuntosSubidos: number(),
  adjuntosRequeridos: number(),
  adjuntosPendientesFisicos: nullable(number()),
});

export type DocumentoCompletado = InferOutput<typeof DocumentoCompletadoSchema>;

// ============================================
// Schemas de Resúmenes y Reportes
// ============================================

export const ResumenDocumentosMiembroSchema = object({
  usuarioId: number(),
  keycloakId: optional(nullable(string())),
  usuarioNombre: nullable(string()),
  usuarioEmail: nullable(string()),
  totalDocumentos: number(),
  documentosCompletos: number(),
  documentosPendientes: number(),
  documentosSinIniciar: number(),
  adjuntosPendientesFisicos: number(),
});

export type ResumenDocumentosMiembro = InferOutput<typeof ResumenDocumentosMiembroSchema>;

export const EstadisticaTipoDocumentoSchema = object({
  tipoDocumentoId: number(),
  tipoDocumentoNombre: string(),
  tipoDocumentoCodigo: string(),
  totalAplicable: number(),
  completados: number(),
  enProgreso: number(),
  sinIniciar: number(),
  porcentajeCompletitud: number(),
});

export type EstadisticaTipoDocumento = InferOutput<typeof EstadisticaTipoDocumentoSchema>;

export const ReporteDocumentosSchema = object({
  totalUsuarios: number(),
  usuariosCompletos: number(),
  usuariosParciales: number(),
  usuariosSinIniciar: number(),
  porcentajePromedioCompletitud: number(),
  estadisticasPorTipo: array(EstadisticaTipoDocumentoSchema),
  detalleUsuarios: array(ResumenDocumentosMiembroSchema),
});

export type ReporteDocumentos = InferOutput<typeof ReporteDocumentosSchema>;

// ============================================
// Schemas de Requests
// ============================================

export const GuardarDocumentoRequestSchema = object({
  tipoDocumentoId: number(),
  usuarioId: number(),
  respuestas: record(string(), string()),
  finalizar: boolean(),
});

export type GuardarDocumentoRequest = InferOutput<typeof GuardarDocumentoRequestSchema>;

export const ObservarDocumentoRequestSchema = object({
  observacion: string(),
});

export type ObservarDocumentoRequest = InferOutput<typeof ObservarDocumentoRequestSchema>;

// Schema para campo en request de creación/actualización
export const CampoRequestSchema = object({
  codigo: string(),
  etiqueta: string(),
  placeholder: optional(nullable(string())),
  tipoCampo: TipoCampoSchema,
  opciones: optional(array(string())),
  seccion: optional(nullable(string())),
  obligatorio: optional(boolean()),
  ordenVisualizacion: optional(number()),
  campoPadreCodigo: optional(nullable(string())),
  campoPadreValor: optional(nullable(string())),
});

export type CampoRequest = InferOutput<typeof CampoRequestSchema>;

// Schema para adjunto en request de creación/actualización
export const AdjuntoRequestSchema = object({
  codigo: string(),
  nombre: string(),
  descripcion: optional(nullable(string())),
  obligatorio: optional(boolean()),
  requiereEntregaFisica: optional(boolean()),
  tiposPermitidos: optional(nullable(string())),
  maxSizeMB: optional(number()),
  ordenVisualizacion: optional(number()),
});

export type AdjuntoRequest = InferOutput<typeof AdjuntoRequestSchema>;

// Schema para crear/actualizar tipo de documento
export const CrearTipoDocumentoRequestSchema = object({
  codigo: string(),
  nombre: string(),
  descripcion: optional(nullable(string())),
  audiencias: array(AudienciaDocumentoSchema),
  activo: optional(boolean()),
  requiereFirma: optional(boolean()),
  ordenVisualizacion: optional(number()),
  campos: optional(array(CampoRequestSchema)),
  adjuntos: optional(array(AdjuntoRequestSchema)),
  // Fechas de vencimiento
  fechaLimiteFormulario: optional(nullable(string())),
  fechaLimiteEntregaFisica: optional(nullable(string())),
  crearEventoCalendario: optional(boolean()),
});

export type CrearTipoDocumentoRequest = InferOutput<typeof CrearTipoDocumentoRequestSchema>;

// ============================================
// Helpers de UI
// ============================================

export const ESTADO_CONFIG: Record<EstadoDocumento, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'edit',
  },
  PENDIENTE_ADJUNTOS: {
    label: 'Pendiente adjuntos',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'paperclip',
  },
  PENDIENTE_FISICO: {
    label: 'Pendiente entrega',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'inbox',
  },
  COMPLETO: {
    label: 'Completo',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
  },
  OBSERVADO: {
    label: 'Con observaciones',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'alert-triangle',
  },
};
