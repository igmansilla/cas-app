/**
 * Servicio de Pagos
 * 
 * Gestiona planes de pago, inscripciones y cuotas.
 */

import { parse, array } from 'valibot';
import { client } from '../client';
import { 
  PlanPagoSchema, 
  InscripcionSchema,
  CuotaSchema,
  IntencionPagoResponseSchema,
  type PlanPago, 
  type PlanPagoRequest,
  type Inscripcion,
  type InscripcionRequest,
  type Cuota,
  type IntencionPagoResponse,
  type IntencionPagoRequest
} from '../schemas/pagos';

const PlanesSchema = array(PlanPagoSchema);
const InscripcionesSchema = array(InscripcionSchema);
const CuotasSchema = array(CuotaSchema);

export const pagosService = {
  
  // ============================================
  // Administración de Planes (CONSEJO/ADMIN)
  // ============================================

  /**
   * Lista todos los planes activos (para admin lista los activos, 
   * pero puede haber otro endpoint para todos si fuera necesario.
   * El controller AdminPlanPagoController no tiene list, usa PlanPagoController.list() que filtra activos.
   * Si necesitamos inactivos, habría que revisar backend. Por ahora usamos el público.)
   */
  listarPlanes: async (): Promise<PlanPago[]> => {
    const response = await client.get('/pagos/planes');
    
    // HATEOAS handling
    if (response.data?._embedded?.planPagoModels) {
      return parse(PlanesSchema, response.data._embedded.planPagoModels);
    }
    
    if (Array.isArray(response.data)) {
      return parse(PlanesSchema, response.data);
    }
    
    return [];
  },

  /**
   * Obtiene un plan por ID
   */
  obtenerPlan: async (id: number): Promise<PlanPago> => {
    const response = await client.get(`/pagos/planes/${id}`);
    return parse(PlanPagoSchema, response.data);
  },

  /**
   * Crea un nuevo plan de pago (Solo CONSEJO/ADMIN)
   */
  crearPlan: async (plan: PlanPagoRequest): Promise<PlanPago> => {
    const response = await client.post('/admin/planes', plan);
    return parse(PlanPagoSchema, response.data);
  },

  /**
   * Actualiza un plan existente (Solo CONSEJO/ADMIN)
   */
  actualizarPlan: async (id: number, plan: PlanPagoRequest): Promise<PlanPago> => {
    const response = await client.put(`/admin/planes/${id}`, plan);
    return parse(PlanPagoSchema, response.data);
  },

  // ============================================
  // Gestión de Inscripciones y Pagos (USUARIOS)
  // ============================================

  /**
   * Inscribe al usuario actual en un plan
   */
  inscribirse: async (data: InscripcionRequest): Promise<Inscripcion> => {
    const response = await client.post('/pagos/inscripciones', data);
    return parse(InscripcionSchema, response.data);
  },

  /**
   * Obtiene una inscripción por ID
   */
  obtenerInscripcion: async (id: number): Promise<Inscripcion> => {
    const response = await client.get(`/pagos/inscripciones/${id}`);
    return parse(InscripcionSchema, response.data);
  },

  /**
   * Lista las inscripciones del usuario actual
   */
  listarMisInscripciones: async (): Promise<Inscripcion[]> => {
    const response = await client.get('/pagos/inscripciones/mis');
    
    // HATEOAS handling
    if (response.data?._embedded?.inscripcionResponses) {
      return parse(InscripcionesSchema, response.data._embedded.inscripcionResponses);
    }

    if (Array.isArray(response.data)) {
      return parse(InscripcionesSchema, response.data);
    }
    
    return [];
  },

  /**
   * Obtiene las cuotas de una inscripción
   */
  obtenerCuotas: async (idInscripcion: number): Promise<Cuota[]> => {
    const response = await client.get(`/pagos/inscripciones/${idInscripcion}/cuotas`);
    
    // HATEOAS handling
    if (response.data?._embedded?.cuotaModels) {
      return parse(CuotasSchema, response.data._embedded.cuotaModels);
    }

    if (Array.isArray(response.data)) {
      return parse(CuotasSchema, response.data);
    }

    return [];
  },

  /**
   * Crea una intención de pago (genera link de MP)
   */
  crearIntencionPago: async (data: IntencionPagoRequest): Promise<IntencionPagoResponse> => {
    const response = await client.post('/pagos/intenciones', data);
    return parse(IntencionPagoResponseSchema, response.data);
  }
};
