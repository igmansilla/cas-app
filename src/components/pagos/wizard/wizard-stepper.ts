/**
 * Definición del stepper global para el wizard de planes de pago.
 * Separado en su propio archivo para evitar problemas con Fast Refresh de Vite.
 */

import { defineStepper } from "@stepperize/react";
import { object } from "valibot";
import { PlanBSchema, MigracionSchema, DevolucionSchema } from './wizard-schemas';

export const GlobalStepper = defineStepper(
    { id: "planA", title: "Plan A", schema: object({}) },
    { id: "planB", title: "Plan B", schema: PlanBSchema },
    { id: "migracion", title: "Migración", schema: MigracionSchema },
    { id: "devolucion", title: "Devolución", schema: DevolucionSchema },
    { id: "revision", title: "Revisión", schema: object({}) }
);
