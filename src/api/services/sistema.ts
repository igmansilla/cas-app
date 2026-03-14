import { parse } from 'valibot';

import { client } from '../client';
import {
  ServiciosExternosStatusResponseSchema,
  type ServiciosExternosStatusResponse,
} from '../schemas/sistema';

export const sistemaService = {
  obtenerEstadoServiciosExternos: async (): Promise<ServiciosExternosStatusResponse> => {
    const response = await client.get('/admin/config/services-status');
    return parse(ServiciosExternosStatusResponseSchema, response.data);
  },
};
