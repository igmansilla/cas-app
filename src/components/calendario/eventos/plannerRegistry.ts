export type EventoPlanningMode = "generic" | "custom-ready";

export interface EventoPlannerDefinition {
  codigo: string;
  titulo: string;
  planningMode: EventoPlanningMode;
  customScreenSlug?: string;
  helperText?: string;
}

const EVENTO_PLANNER_REGISTRY: Record<string, EventoPlannerDefinition> = {
  "casilistas": {
    codigo: "casilistas",
    titulo: "Casilistas",
    planningMode: "custom-ready",
    customScreenSlug: "casilistas",
    helperText: "Preparado para sumar una ficha específica de producción y venta.",
  },
  "pastelitos": {
    codigo: "pastelitos",
    titulo: "Pastelitos",
    planningMode: "custom-ready",
    customScreenSlug: "pastelitos",
    helperText: "Preparado para una pantalla con elaboración, stock y jornada de venta.",
  },
  "pizza-libre": {
    codigo: "pizza-libre",
    titulo: "Pizza Libre",
    planningMode: "custom-ready",
    customScreenSlug: "pizza-libre",
    helperText: "Preparado para una pantalla custom con salón, turnos, entradas y compras.",
  },
  "celebracion": {
    codigo: "celebracion",
    titulo: "Celebración",
    planningMode: "custom-ready",
    customScreenSlug: "celebracion",
    helperText: "Preparado para una ficha específica por tipo de celebración.",
  },
  "jornada-carpas": {
    codigo: "jornada-carpas",
    titulo: "Jornada de carpas",
    planningMode: "custom-ready",
    customScreenSlug: "jornada-carpas",
    helperText: "Preparado para una vista de tareas, materiales y responsables.",
  },
  "fotata": {
    codigo: "fotata",
    titulo: "Fotata",
    planningMode: "custom-ready",
    customScreenSlug: "fotata",
    helperText: "Preparado para una pantalla con entregables y responsables de edición.",
  },
};

export function getEventoPlannerDefinition(codigo?: string | null): EventoPlannerDefinition {
  const normalized = (codigo ?? "").trim().toLowerCase();

  if (!normalized) {
    return {
      codigo: "actividad",
      titulo: "Evento departamental",
      planningMode: "generic",
    };
  }

  return EVENTO_PLANNER_REGISTRY[normalized] ?? {
    codigo: normalized,
    titulo: normalized,
    planningMode: "generic",
  };
}

export function supportsCustomPlanning(codigo?: string | null) {
  return getEventoPlannerDefinition(codigo).planningMode === "custom-ready";
}