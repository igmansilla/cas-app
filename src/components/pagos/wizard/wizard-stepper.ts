/**
 * Definición del stepper global para el wizard de planes de pago.
 * Separado en su propio archivo para evitar problemas con Fast Refresh de Vite.
 */

import { defineStepper } from "@stepperize/react";
import { object } from "valibot";
import { ReglasTransicionSchema, DevolucionSchema } from './wizard-schemas';

export const GlobalStepper = defineStepper(
    { id: "planA", title: "Plan A", schema: object({}) },
    { id: "reglas", title: "Reglas de Transición", schema: ReglasTransicionSchema },
    { id: "devolucion", title: "Devolución", schema: DevolucionSchema },
    { id: "revision", title: "Revisión", schema: object({}) }
);
