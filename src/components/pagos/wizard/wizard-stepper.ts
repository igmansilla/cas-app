/**
 * Definición del stepper global para el wizard de planes de pago.
 * Separado en su propio archivo para evitar problemas con Fast Refresh de Vite.
 * 
 * Las reglas de migración se configuran como sub-step dentro de Plan A y Plan B.
 * Plan C no tiene migraciones (es el último plan).
 */

import { defineStepper } from "@stepperize/react";
import { object } from "valibot";
import { DevolucionSchema } from './wizard-schemas';

export const GlobalStepper = defineStepper(
    { id: "planA", title: "Plan A", schema: object({}) },
    { id: "planB", title: "Plan B", schema: object({}) },
    { id: "planC", title: "Plan C", schema: object({}) },
    { id: "devolucion", title: "Devolución", schema: DevolucionSchema },
    { id: "revision", title: "Revisión", schema: object({}) }
);
