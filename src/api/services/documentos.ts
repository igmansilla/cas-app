/**
 * Servicios API para el módulo de Documentación
 */

import { client } from '../client';
import type {
  TipoDocumento,
  TipoDocumentoImprimible,
  DocumentoCompletado,
  ArchivoAdjunto,
  ResumenDocumentosMiembro,
  ReporteDocumentos,
  GuardarDocumentoRequest,
  ObservarDocumentoRequest,
  CrearTipoDocumentoRequest,
} from '../schemas/documentos';

// ============================================
// Servicio de Documentos
// ============================================

export const documentosService = {
  // ========================================
  // Tipos de Documento
  // ========================================

  /**
   * Obtiene todos los tipos de documento activos
   */
  getTiposDocumento: async (): Promise<TipoDocumento[]> => {
    const response = await client.get('/tipos-documento');
    return response.data;
  },

  /**
   * Obtiene un tipo de documento por ID
   */
  getTipoDocumento: async (id: number): Promise<TipoDocumento> => {
    const response = await client.get(`/tipos-documento/${id}`);
    return response.data;
  },

  /**
   * Obtiene un tipo de documento por código
   */
  getTipoDocumentoByCodigo: async (codigo: string): Promise<TipoDocumento> => {
    const response = await client.get(`/tipos-documento/codigo/${codigo}`);
    return response.data;
  },

  /**
   * Crea un nuevo tipo de documento (solo admin)
   */
  crearTipoDocumento: async (request: CrearTipoDocumentoRequest): Promise<TipoDocumento> => {
    const response = await client.post('/tipos-documento', request);
    return response.data;
  },

  /**
   * Actualiza un tipo de documento existente (solo admin)
   */
  actualizarTipoDocumento: async (id: number, request: CrearTipoDocumentoRequest): Promise<TipoDocumento> => {
    const response = await client.put(`/tipos-documento/${id}`, request);
    return response.data;
  },

  /**
   * Elimina un tipo de documento (solo admin)
   * Puede ser una eliminación física o solo desactivación si posee documentos asociados.
   */
  desactivarTipoDocumento: async (id: number): Promise<{ fisico: boolean; mensaje: string }> => {
    const response = await client.delete(`/tipos-documento/${id}`);
    return response.data;
  },

  // ========================================
  // Documentos de Usuario
  // ========================================

  /**
   * Obtiene el resumen de documentos de una familia
   */
  getResumenFamilia: async (familiaId: number): Promise<ResumenDocumentosMiembro[]> => {
    const response = await client.get(`/documentos/familia/${familiaId}`);
    return response.data;
  },

  /**
   * Obtiene todos los documentos de un usuario
   */
  getDocumentosUsuario: async (keycloakId: string): Promise<DocumentoCompletado[]> => {
    const response = await client.get(`/documentos/keycloak/${encodeURIComponent(keycloakId)}`);
    return response.data;
  },

  /**
   * Obtiene un documento específico de un usuario
   */
  getDocumento: async (tipoDocumentoId: number, keycloakId: string): Promise<DocumentoCompletado> => {
    const response = await client.get(`/documentos/tipo/${tipoDocumentoId}/keycloak/${encodeURIComponent(keycloakId)}`);
    return response.data;
  },

  /**
   * Guarda o actualiza un documento
   */
  guardarDocumento: async (request: GuardarDocumentoRequest): Promise<DocumentoCompletado> => {
    const response = await client.post('/documentos', request);
    return response.data;
  },

  /**
   * Marca un documento con observaciones y solicita corrección.
   */
  observarDocumento: async (documentoId: number, request: ObservarDocumentoRequest): Promise<DocumentoCompletado> => {
    const response = await client.post(`/documentos/${documentoId}/observaciones`, request);
    return response.data;
  },

  /**
   * Sube un archivo adjunto
   */
  subirAdjunto: async (documentoId: number, adjuntoRequeridoId: number, file: File): Promise<ArchivoAdjunto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(
      `/documentos/${documentoId}/adjuntos/${adjuntoRequeridoId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Marca un adjunto como entregado físicamente (solo admin/secretario)
   */
  marcarEntregaFisica: async (archivoId: number): Promise<void> => {
    await client.post(`/documentos/adjuntos/${archivoId}/entrega-fisica`);
  },

  /**
   * Genera la URL para descargar un archivo adjunto
   */
  getUrlDescargaAdjunto: (archivoId: number): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}/documentos/adjuntos/${archivoId}/descargar`;
  },

  /**
   * Descarga un archivo adjunto como Blob
   */
  descargarAdjunto: async (archivoId: number): Promise<Blob> => {
    const response = await client.get(`/documentos/adjuntos/${archivoId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },


  // ========================================
  // Reportes (Dirigentes/Secretario)
  // ========================================

  /**
   * Obtiene el reporte de documentación para un grupo
   */
  getReporteGrupo: async (grupoId: string): Promise<ReporteDocumentos> => {
    const response = await client.get(`/documentos/reportes/grupo/${grupoId}`);
    return response.data;
  },

  /**
   * Obtiene el reporte general de documentación (secretario)
   */
  getReporteGeneral: async (): Promise<ReporteDocumentos> => {
    const response = await client.get('/documentos/reportes/general');
    return response.data;
  },

  /**
   * Obtiene el detalle de documentos de un usuario específico
   */
  getDetalleDocumentosUsuario: async (keycloakId: string): Promise<DocumentoCompletado[]> => {
    const response = await client.get(`/documentos/reportes/keycloak/${encodeURIComponent(keycloakId)}/detalle`);
    return response.data;
  },

  /**
   * Obtiene los tipos de documento imprimibles para un usuario específico.
   */
  getTiposImprimiblesUsuario: async (keycloakId: string): Promise<TipoDocumentoImprimible[]> => {
    const response = await client.get(`/documentos/reportes/keycloak/${encodeURIComponent(keycloakId)}/tipos-imprimibles`);
    return response.data;
  },

  /**
   * Descarga el PDF compuesto a partir de adjuntos PDF cargados.
   */
  descargarAdjuntosPdf: async (tipoDocumentoId: number, keycloakId: string): Promise<Blob> => {
    const response = await client.get(`/documentos/tipo/${tipoDocumentoId}/keycloak/${encodeURIComponent(keycloakId)}/adjuntos-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtiene los datos necesarios para generar un PDF (template + datos del usuario + respuestas)
   */
  getPdfData: async (tipoDocumentoId: number, keycloakId: string): Promise<{
    template: {
      id: number;
      codigo: string;
      nombre: string;
      pdfBase64: string;
      pageWidth: number;
      pageHeight: number;
      campos: Array<{
        codigo: string;
        nombre: string;
        x: number;
        y: number;
        fontSize: number;
        tipo: string;
        valorFijo?: string;
      }>;
    };
    datos: Record<string, unknown>;
    documentoExiste: boolean;
    nombreUsuario: string;
  }> => {
    const response = await client.get(`/documentos/tipo/${tipoDocumentoId}/keycloak/${encodeURIComponent(keycloakId)}/pdf-data`);
    return response.data;
  },
};
