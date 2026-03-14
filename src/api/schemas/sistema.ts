import {
  array,
  boolean,
  nullable,
  number,
  object,
  optional,
  string,
  type InferOutput,
} from 'valibot';

export const CampoServicioStatusSchema = object({
  key: string(),
  label: string(),
  required: boolean(),
  status: string(),
  detail: optional(nullable(string())),
});

export type CampoServicioStatus = InferOutput<typeof CampoServicioStatusSchema>;

export const ServicioExternoStatusSchema = object({
  code: string(),
  name: string(),
  status: string(),
  summary: string(),
  fields: array(CampoServicioStatusSchema),
});

export type ServicioExternoStatus = InferOutput<typeof ServicioExternoStatusSchema>;

export const ServiciosExternosStatusResponseSchema = object({
  timestamp: string(),
  missingRequiredCount: number(),
  warningCount: number(),
  services: array(ServicioExternoStatusSchema),
});

export type ServiciosExternosStatusResponse = InferOutput<typeof ServiciosExternosStatusResponseSchema>;
