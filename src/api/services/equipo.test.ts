import { beforeEach, describe, expect, it, vi } from 'vitest';

import { client } from '../client';
import { equipoService } from './equipo';

vi.mock('../client', () => ({
  client: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(client.get);

describe('equipoService', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('normalizes missing nested arrays in categorias responses', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          nombre: 'Abrigo',
          descripcion: null,
          orden: 1,
          items: [
            {
              id: 10,
              nombre: 'Campera',
              cantidad: 1,
              obligatorio: true,
              criticidad: 'CRITICO',
              notas: null,
              evitar: null,
              orden: 1,
              requiereFoto: false,
            },
            null,
          ],
        },
        {
          id: 2,
          nombre: 'Accesorios',
          descripcion: null,
          orden: 2,
        },
        null,
      ],
    });

    const categorias = await equipoService.getCategorias();

    expect(mockedGet).toHaveBeenCalledWith('/equipo/categorias');
    expect(categorias).toEqual([
      {
        id: 1,
        nombre: 'Abrigo',
        descripcion: null,
        orden: 1,
        items: [
          {
            id: 10,
            nombre: 'Campera',
            cantidad: 1,
            obligatorio: true,
            criticidad: 'CRITICO',
            notas: null,
            evitar: null,
            orden: 1,
            requiereFoto: false,
            requisitosFoto: [],
          },
        ],
      },
      {
        id: 2,
        nombre: 'Accesorios',
        descripcion: null,
        orden: 2,
        items: [],
      },
    ]);
  });

  it('returns an empty array when mis fotos is missing', async () => {
    mockedGet.mockResolvedValueOnce({ data: undefined });

    const fotos = await equipoService.getMisFotos();

    expect(mockedGet).toHaveBeenCalledWith('/equipo/mis-fotos');
    expect(fotos).toEqual([]);
  });
});