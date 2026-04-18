/**
 * Schemas de Valibot para el módulo de Revisión de Carpas
 */

import {
  object,
  string,
  number,
  array,
  nullable,
  picklist,
  type InferOutput,
} from 'valibot';

// ============================================
// Enums
// ============================================

export const EstadoCarpaSchema = picklist([
  'DISPONIBLE',
  'NECESITA_REPARACION',
  'FUERA_DE_SERVICIO',
]);
export type EstadoCarpa = InferOutput<typeof EstadoCarpaSchema>;

export const EstadoComponenteSchema = picklist([
  'BUENO',
  'REGULAR',
  'MALO',
  'FALTANTE',
]);
export type EstadoComponente = InferOutput<typeof EstadoComponenteSchema>;

export const TipoComponenteSchema = picklist([
  'CUERPO_TELA',
  'SOBRETECHO',
  'PARANTES_VARILLAS',
  'ESTACAS',
  'TENSORES_VIENTOS',
  'PISO_FOOTPRINT',
  'CIERRES',
  'BOLSA_FUNDA',
]);
export type TipoComponente = InferOutput<typeof TipoComponenteSchema>;

// ============================================
// Schemas de Respuesta
// ============================================

export const FotoRevisionSchema = object({
  id: number(),
  revisionId: number(),
  descripcion: nullable(string()),
  ancho: nullable(number()),
  alto: nullable(number()),
  tamanioBytes: nullable(number()),
  fechaSubida: string(),
});
export type FotoRevision = InferOutput<typeof FotoRevisionSchema>;

export const ComponenteRevisionSchema = object({
  id: number(),
  tipoComponente: TipoComponenteSchema,
  estado: EstadoComponenteSchema,
  observacion: nullable(string()),
});
export type ComponenteRevisionResponse = InferOutput<typeof ComponenteRevisionSchema>;

export const RevisionResumenSchema = object({
  id: number(),
  fechaRevision: string(),
  estadoGeneral: EstadoCarpaSchema,
  revisorNombre: nullable(string()),
  cantidadFotos: number(),
});
export type RevisionResumen = InferOutput<typeof RevisionResumenSchema>;

export const CarpaSchema = object({
  id: number(),
  nombre: string(),
  marca: nullable(string()),
  modelo: nullable(string()),
  capacidad: nullable(number()),
  fechaCreacion: string(),
  ultimaRevision: nullable(RevisionResumenSchema),
});
export type Carpa = InferOutput<typeof CarpaSchema>;

export const RevisionSchema = object({
  id: number(),
  carpaId: number(),
  carpaNombre: string(),
  revisorNombre: nullable(string()),
  revisorKeycloakId: nullable(string()),
  fechaRevision: string(),
  estadoGeneral: EstadoCarpaSchema,
  observacionesGenerales: nullable(string()),
  fechaCreacion: string(),
  componentes: array(ComponenteRevisionSchema),
  fotos: array(FotoRevisionSchema),
});
export type Revision = InferOutput<typeof RevisionSchema>;

export const ResumenCarpasSchema = object({
  totalCarpas: number(),
  disponibles: number(),
  necesitanReparacion: number(),
  fueraDeServicio: number(),
  sinRevisar: number(),
});
export type ResumenCarpas = InferOutput<typeof ResumenCarpasSchema>;

// ============================================
// Helpers de UI
// ============================================

export const ESTADO_CARPA_CONFIG: Record<
  EstadoCarpa,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  DISPONIBLE: {
    label: 'Disponible',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  NECESITA_REPARACION: {
    label: 'Necesita reparación',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  FUERA_DE_SERVICIO: {
    label: 'Fuera de servicio',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
};

export const ESTADO_COMPONENTE_CONFIG: Record<
  EstadoComponente,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    emoji: string;
  }
> = {
  BUENO: {
    label: 'Bueno',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    emoji: '✅',
  },
  REGULAR: {
    label: 'Regular',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    emoji: '⚠️',
  },
  MALO: {
    label: 'Malo',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    emoji: '❌',
  },
  FALTANTE: {
    label: 'Faltante',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    emoji: '➖',
  },
};

export const TIPO_COMPONENTE_CONFIG: Record<
  TipoComponente,
  { label: string; descripcion: string }
> = {
  CUERPO_TELA: { label: 'Cuerpo / Tela', descripcion: 'Tela principal de la carpa' },
  SOBRETECHO: { label: 'Sobretecho', descripcion: 'Cobertura impermeable superior' },
  PARANTES_VARILLAS: { label: 'Parantes / Varillas', descripcion: 'Estructura de soporte' },
  ESTACAS: { label: 'Estacas', descripcion: 'Elementos de anclaje al suelo' },
  TENSORES_VIENTOS: { label: 'Tensores / Vientos', descripcion: 'Cuerdas de tensado' },
  PISO_FOOTPRINT: { label: 'Piso / Footprint', descripcion: 'Base inferior de la carpa' },
  CIERRES: { label: 'Cierres', descripcion: 'Cierres de puertas y ventilaciones' },
  BOLSA_FUNDA: { label: 'Bolsa / Funda', descripcion: 'Funda de transporte' },
};
