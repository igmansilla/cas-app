/**
 * Query Keys para el módulo de Pagos
 */

export const pagosKeys = {
  planes: {
    todos: ['planes'] as const,
    detalle: (id: number) => ['planes', id] as const,
  },
  inscripciones: {
    mis: ['inscripciones', 'mis'] as const,
    detalle: (id: number) => ['inscripciones', id] as const,
    cuotas: (id: number) => ['inscripciones', id, 'cuotas'] as const,
  },
  config: {
    facturacion: ['config', 'facturacion'] as const,
  },
};
