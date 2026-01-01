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
  InscripcionAdminSchema,
  ResumenFinancieroSchema,
  SolicitudBajaSchema,
  SolicitudBajaAdminSchema,
  type PlanPago,
  type PlanPagoRequest,
  type Inscripcion,
  type InscripcionRequest,
  type Cuota,
  type IntencionPagoResponse,
  type IntencionPagoRequest,
  type InscripcionAdmin,
  type ResumenFinanciero,
  type RegistroPagoManualRequest,
  type AdminInscripcionFilters,
  type SolicitudBaja,
  type SolicitudBajaAdmin
} from '../schemas/pagos';

const PlanesSchema = array(PlanPagoSchema);
const InscripcionesSchema = array(InscripcionSchema);
const CuotasSchema = array(CuotaSchema);
const InscripcionesAdminSchema = array(InscripcionAdminSchema);

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

  /**
   * Lista TODOS los planes (activos e inactivos) - Solo ADMIN
   */
  listarTodos: async (): Promise<PlanPago[]> => {
    const response = await client.get('/admin/planes');

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
   * Cambia el estado (activo/inactivo) de un plan
   */
  toggleEstado: async (id: number, activo: boolean): Promise<PlanPago> => {
    const response = await client.patch(`/admin/planes/${id}/estado`, { activo });
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
   * Lista las inscripciones de los hijos del usuario actual.
   * Útil para que padres/tutores vean y paguen cuotas de sus hijos.
   */
  listarInscripcionesHijos: async (): Promise<Inscripcion[]> => {
    const response = await client.get('/pagos/inscripciones/hijos');

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
  },

  // ============================================
  // Administración de Inscripciones (TESORERO/ADMIN)
  // ============================================

  /**
   * Lista inscripciones con filtros opcionales (Admin)
   */
  listarInscripcionesAdmin: async (filters?: AdminInscripcionFilters): Promise<InscripcionAdmin[]> => {
    const response = await client.get('/admin/inscripciones', { params: filters });

    // HATEOAS handling
    if (response.data?._embedded?.inscripciones) {
      return parse(InscripcionesAdminSchema, response.data._embedded.inscripciones);
    }

    if (Array.isArray(response.data)) {
      return parse(InscripcionesAdminSchema, response.data);
    }

    return [];
  },

  /**
   * Obtiene resumen financiero para dashboard de tesorería
   */
  obtenerResumenFinanciero: async (): Promise<ResumenFinanciero> => {
    const response = await client.get('/admin/inscripciones/resumen');
    return parse(ResumenFinancieroSchema, response.data);
  },

  /**
   * Lista inscripciones migradas a Plan B (para auditoría)
   */
  listarMigraciones: async (): Promise<InscripcionAdmin[]> => {
    const response = await client.get('/admin/inscripciones/migraciones');

    if (response.data?._embedded?.inscripciones) {
      return parse(InscripcionesAdminSchema, response.data._embedded.inscripciones);
    }

    if (Array.isArray(response.data)) {
      return parse(InscripcionesAdminSchema, response.data);
    }

    return [];
  },

  /**
   * Obtiene detalle de una inscripción (Admin)
   */
  obtenerInscripcionAdmin: async (id: number): Promise<InscripcionAdmin> => {
    const response = await client.get(`/admin/inscripciones/${id}`);
    return parse(InscripcionAdminSchema, response.data);
  },

  /**
   * Registra un pago manual (efectivo/transferencia)
   */
  registrarPagoManual: async (request: RegistroPagoManualRequest): Promise<void> => {
    await client.post('/admin/pagos/manual', request);
  },

  /**
   * Regulariza una cuota atrasada (solo tesorero/admin)
   * Cambia el estado de ATRASADA a REGULARIZADA y decrementa el contador
   */
  regularizarCuota: async (idCuota: number, metodo: string, notas?: string): Promise<Cuota> => {
    const response = await client.put(`/admin/cuotas/${idCuota}/regularizar`, { metodo, notas });
    return parse(CuotaSchema, response.data);
  },

  // ============================================
  // Solicitudes de Baja
  // ============================================

  /**
   * Solicita la baja de una inscripción
   */
  solicitarBaja: async (inscripcionId: number, motivo?: string): Promise<SolicitudBaja> => {
    const response = await client.post(`/pagos/inscripciones/${inscripcionId}/solicitar-baja`, { motivo });
    return parse(SolicitudBajaSchema, response.data);
  },

  /**
   * Lista solicitudes de baja (Admin)
   */
  listarSolicitudesBaja: async (estado?: string): Promise<SolicitudBajaAdmin[]> => {
    const response = await client.get('/admin/solicitudes-baja', { params: estado ? { estado } : {} });
    if (Array.isArray(response.data)) {
      return parse(array(SolicitudBajaAdminSchema), response.data);
    }
    return [];
  },

  /**
   * Cuenta solicitudes pendientes (Admin)
   */
  contarSolicitudesPendientes: async (): Promise<number> => {
    const response = await client.get('/admin/solicitudes-baja/pendientes/count');
    return response.data?.pendientes ?? 0;
  },

  /**
   * Aprueba una solicitud de baja (Admin)
   */
  aprobarSolicitudBaja: async (id: number, notas?: string): Promise<SolicitudBajaAdmin> => {
    const response = await client.post(`/admin/solicitudes-baja/${id}/aprobar`, { notas });
    return parse(SolicitudBajaAdminSchema, response.data);
  },

  /**
   * Procesa devolución de una solicitud aprobada (Admin)
   */
  procesarDevolucion: async (id: number, referenciaPago?: string): Promise<SolicitudBajaAdmin> => {
    const response = await client.post(`/admin/solicitudes-baja/${id}/procesar`, { referenciaPago });
    return parse(SolicitudBajaAdminSchema, response.data);
  },

  /**
   * Rechaza una solicitud de baja (Admin)
   */
  rechazarSolicitudBaja: async (id: number, motivo: string): Promise<SolicitudBajaAdmin> => {
    const response = await client.post(`/admin/solicitudes-baja/${id}/rechazar`, { notas: motivo });
    return parse(SolicitudBajaAdminSchema, response.data);
  }
};
