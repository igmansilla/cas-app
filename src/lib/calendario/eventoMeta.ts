export type EventoMetaBadge = {
  label: string;
  className: string;
};

export const PUBLICO_OBJETIVO_OPTIONS = [
  { value: "comunidad", label: "Comunidad" },
  { value: "dirigentes", label: "Solo dirigentes" },
  { value: "consejo", label: "Solo consejo" },
  { value: "padres", label: "Solo padres" },
  { value: "acampantes", label: "Solo acampantes" },
  { value: "padres-y-acampantes", label: "Padres y acampantes" },
  { value: "grupo-acampantes", label: "Grupo de acampantes" },
  { value: "grupo-y-padres", label: "Grupo y padres" },
] as const;

export const POLITICA_NOTIFICACION_OPTIONS = [
  { value: "automatica-al-difundir", label: "Automatica al difundir" },
  { value: "manual", label: "Manual" },
  { value: "sin-notificacion", label: "Sin notificacion" },
] as const;

const PUBLICO_OBJETIVO_META: Record<string, EventoMetaBadge> = {
  comunidad: {
    label: "Comunidad",
    className: "bg-indigo-50 text-indigo-700 hover:bg-indigo-50",
  },
  dirigentes: {
    label: "Dirigentes",
    className: "bg-sky-50 text-sky-700 hover:bg-sky-50",
  },
  consejo: {
    label: "Consejo",
    className: "bg-cyan-50 text-cyan-700 hover:bg-cyan-50",
  },
  padres: {
    label: "Padres",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  acampantes: {
    label: "Acampantes",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  "padres-y-acampantes": {
    label: "Padres y acampantes",
    className: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
  "grupo-acampantes": {
    label: "Grupo (acampantes)",
    className: "bg-teal-50 text-teal-700 hover:bg-teal-50",
  },
  "grupo-y-padres": {
    label: "Grupo y padres",
    className: "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-50",
  },
};

const POLITICA_NOTIFICACION_META: Record<string, EventoMetaBadge> = {
  "automatica-al-difundir": {
    label: "Auto al difundir",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  manual: {
    label: "Manual",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  "sin-notificacion": {
    label: "Sin notificacion",
    className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  },
};

const ESTADO_EVENTO_META: Record<string, EventoMetaBadge> = {
  planificado: {
    label: "Planificado",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  establecido: {
    label: "Establecido",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  difundido: {
    label: "Difundido",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

function normalize(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

function fallbackLabel(value?: string | null) {
  if (!value) {
    return "Sin definir";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getPublicoObjetivoBadge(value?: string | null): EventoMetaBadge {
  const key = normalize(value);
  return PUBLICO_OBJETIVO_META[key] ?? {
    label: fallbackLabel(value),
    className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  };
}

export function getPoliticaNotificacionBadge(value?: string | null): EventoMetaBadge {
  const key = normalize(value);
  return POLITICA_NOTIFICACION_META[key] ?? {
    label: fallbackLabel(value),
    className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  };
}

export function getEstadoEventoBadge(value?: string | null): EventoMetaBadge {
  const key = normalize(value);
  return ESTADO_EVENTO_META[key] ?? {
    label: fallbackLabel(value),
    className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  };
}
