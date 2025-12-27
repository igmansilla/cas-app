/**
 * Utilidades para planes de pago - funciones auxiliares compartidas
 */

import { Tent, UserCircle, ChefHat, type LucideIcon } from "lucide-react";
import { AudienciaPlan } from "../../../api/schemas/pagos";

export interface AudienciaInfo {
    label: string;
    icon: LucideIcon;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

/**
 * Obtiene la información visual (icono, colores, label) para una audiencia de plan
 */
export function getAudienciaInfo(audiencia: AudienciaPlan | undefined): AudienciaInfo {
    switch (audiencia) {
        case AudienciaPlan.DIRIGENTE:
            return {
                label: 'Dirigente',
                icon: UserCircle,
                bgClass: 'bg-indigo-100 dark:bg-indigo-950/50',
                textClass: 'text-indigo-700 dark:text-indigo-300',
                borderClass: 'border-indigo-200 dark:border-indigo-800'
            };
        case AudienciaPlan.STAFF_BASE:
            return {
                label: 'Staff Base',
                icon: ChefHat,
                bgClass: 'bg-amber-100 dark:bg-amber-950/50',
                textClass: 'text-amber-700 dark:text-amber-300',
                borderClass: 'border-amber-200 dark:border-amber-800'
            };
        case AudienciaPlan.ACAMPANTE:
        default:
            return {
                label: 'Acampante',
                icon: Tent,
                bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
                textClass: 'text-emerald-700 dark:text-emerald-300',
                borderClass: 'border-emerald-200 dark:border-emerald-800'
            };
    }
}
