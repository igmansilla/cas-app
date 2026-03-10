import { CalendarDays, Coins, Megaphone, Sparkles, Users, Wrench, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

export type DepartamentoOperativoCodigo =
  | "ECONOMIA"
  | "COMUNICACIONES"
  | "OPERACIONES"
  | "ESPIRITUALIDAD"
  | "EVENTOS";

export interface DepartamentoScreen {
  codigo: DepartamentoOperativoCodigo;
  path: string;
  nombre: string;
  resumen: string;
  icon: ComponentType<LucideProps>;
  accentClass: string;
  iconClass: string;
}

export const departmentScreens: DepartamentoScreen[] = [
  {
    codigo: "ECONOMIA",
    path: "/departamentos/economia",
    nombre: "Economía",
    resumen: "Planificación del área, Tesorería y definición de planes dentro de una misma sección financiera.",
    icon: Coins,
    accentClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClass: "text-emerald-600",
  },
  {
    codigo: "COMUNICACIONES",
    path: "/departamentos/comunicaciones",
    nombre: "Comunicaciones",
    resumen: "Campañas, cobertura y reuniones internas de contenido, prensa y difusión.",
    icon: Megaphone,
    accentClass: "border-sky-200 bg-sky-50 text-sky-700",
    iconClass: "text-sky-600",
  },
  {
    codigo: "OPERACIONES",
    path: "/departamentos/operaciones",
    nombre: "Operaciones",
    resumen: "Logística, infraestructura y reuniones internas para coordinar la operación del campamento.",
    icon: Wrench,
    accentClass: "border-stone-200 bg-stone-50 text-stone-700",
    iconClass: "text-stone-600",
  },
  {
    codigo: "ESPIRITUALIDAD",
    path: "/departamentos/espiritualidad",
    nombre: "Espiritualidad",
    resumen: "Celebraciones, espacios formativos y reuniones internas de preparación pastoral.",
    icon: Sparkles,
    accentClass: "border-violet-200 bg-violet-50 text-violet-700",
    iconClass: "text-violet-600",
  },
  {
    codigo: "EVENTOS",
    path: "/departamentos/eventos",
    nombre: "Eventos",
    resumen: "Canónicos del año, adicionales del área y reuniones internas de coordinación del departamento.",
    icon: CalendarDays,
    accentClass: "border-orange-200 bg-orange-50 text-orange-700",
    iconClass: "text-orange-600",
  },
];

export const groupsScreen = {
  path: "/reuniones",
  nombre: "Grupos",
  resumen: "Reuniones con grupos de acampantes o dirigentes y seguimiento de asistencia.",
  icon: Users,
};

export const departmentScreenByCode = Object.fromEntries(
  departmentScreens.map((screen) => [screen.codigo, screen])
) as Record<DepartamentoOperativoCodigo, DepartamentoScreen>;