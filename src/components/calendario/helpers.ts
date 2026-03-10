/**
 * Funciones auxiliares para el calendario
 */

import { casColors } from "../../lib/colors";

export const obtenerColorEvento = (tipo: string) => {
  switch (tipo) {
    case "importante":
      return casColors.primary.orange;
    case "fecha_limite":
    case "fecha-limite":
      return casColors.primary.red;
    case "reunion":
      return casColors.nature.green[600];
    case "actividad":
      return casColors.ui.info;
    case "taller":
      return casColors.nature.green[500];
    case "excursion":
      return casColors.nature.mountain;
    case "vencimiento-cuota":
    case "vencimiento_cuota":
      return "#f59e0b"; // amber warning
    case "casilistas":
      return "#FF8F4D"; // naranja cálido
    case "pastelitos":
      return "#D69E2E"; // dorado
    case "pizza-libre":
    case "pizza_libre":
      return "#E53E3E"; // rojo fiesta
    case "celebracion":
      return "#8B5CF6"; // violeta especial
    case "jornada-carpas":
    case "jornada_carpas":
      return "#38A169"; // verde operativo
    case "fotata":
      return "#3182CE"; // azul comunicación
    case "receso":
    case "RECESO":
      return "#A0AEC0"; // Gris azulado (cool gray 400)
    case "feriado":
    case "inamovible":
    case "trasladable":
    case "nolaborable":
    case "puente":
      return "#7DD3FC"; // Celeste sky-300 para feriados
    default:
      return casColors.ui.text.secondary;
  }
};

export const obtenerIconoEvento = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case "importante":
      return "⭐";
    case "fecha_limite":
    case "fecha-limite":
      return "⏰";
    case "reunion":
      return "👥";
    case "actividad":
      return "🏕️";
    case "taller":
      return "📚";
    case "excursion":
      return "🥾";
    case "vencimiento-cuota":
    case "vencimiento_cuota":
      return "💸";
    case "casilistas":
      return "🍕";
    case "pastelitos":
      return "🥐";
    case "pizza-libre":
    case "pizza_libre":
      return "🎉";
    case "celebracion":
      return "🎊";
    case "jornada-carpas":
    case "jornada_carpas":
      return "⛺";
    case "fotata":
      return "📸";
    case "receso":
      return "🚫";
    case "feriado":
    case "inamovible":
    case "trasladable":
    case "nolaborable":
    case "puente":
      return "🇦🇷";
    default:
      return "📅";
  }
};

