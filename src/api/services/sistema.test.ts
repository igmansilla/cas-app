import { beforeEach, describe, expect, it, vi } from 'vitest';

import { client } from '../client';
import { sistemaService } from './sistema';

vi.mock('../client', () => ({
  client: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(client.get);

describe('sistemaService', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('consulta el endpoint admin y parsea respuesta valida', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        timestamp: '2026-03-14T16:00:00Z',
        missingRequiredCount: 1,
        warningCount: 2,
        services: [
          {
            code: 'mercadopago',
            name: 'MercadoPago',
            status: 'incomplete',
            summary: 'Falta token',
            fields: [
              {
                key: 'mercadopago.accessToken',
                label: 'Access token',
                required: true,
                status: 'missing',
                detail: 'Falta definir MERCADOPAGO_ACCESS_TOKEN.',
              },
            ],
          },
        ],
      },
    });

    const result = await sistemaService.obtenerEstadoServiciosExternos();

    expect(mockedGet).toHaveBeenCalledWith('/admin/config/services-status');
    expect(result.missingRequiredCount).toBe(1);
    expect(result.services[0].code).toBe('mercadopago');
    expect(result.services[0].fields[0].status).toBe('missing');
  });

  it('falla el parseo cuando faltan campos requeridos del contrato', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        missingRequiredCount: 1,
        warningCount: 0,
        services: [],
      },
    });

    await expect(sistemaService.obtenerEstadoServiciosExternos()).rejects.toBeDefined();
  });
});
