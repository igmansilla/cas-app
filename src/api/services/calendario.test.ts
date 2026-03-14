import { beforeEach, describe, expect, it, vi } from 'vitest';

import { client } from '../client';
import { calendarioService } from './calendario';

vi.mock('../client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(client.get);
const mockedPost = vi.mocked(client.post);

describe('calendarioService', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('maps calendario metadata in aEventoCalendario', () => {
    const mapped = calendarioService.aEventoCalendario({
      id: 44,
      serieId: 11,
      titulo: 'Reunion de grupo',
      descripcion: null,
      tipo: 'reunion',
      fechaInicio: '2026-03-13T19:00:00Z',
      fechaFin: '2026-03-13T20:00:00Z',
      ubicacion: null,
      estadoEvento: 'establecido',
      publicoObjetivo: 'grupo-y-padres',
      politicaNotificacion: 'manual',
    });

    expect(mapped.id).toBe('11');
    expect(mapped.realId).toBe(11);
    expect(mapped.estadoEvento).toBe('establecido');
    expect(mapped.publicoObjetivo).toBe('grupo-y-padres');
    expect(mapped.politicaNotificacion).toBe('manual');
  });

  it('maps planificacion anual metadata from backend response', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 7,
          codigo: 'REUNION-GRUPO',
          etiqueta: 'Reunion semanal de grupo',
          departamentoId: 2,
          departamento: 'Dirigentes',
          descripcion: 'Encuentro de seguimiento',
          naturaleza: 'reunion',
          critico: true,
          programado: false,
          eventoId: null,
          publicoObjetivo: 'grupo-acampantes',
          politicaNotificacion: 'automatica-al-difundir',
        },
      ],
    });

    const result = await calendarioService.obtenerPlanificacionAnual(2026);

    expect(mockedGet).toHaveBeenCalledWith('/calendario/planificacion-anual?anio=2026');
    expect(result).toEqual([
      {
        id: 7,
        codigo: 'REUNION-GRUPO',
        etiqueta: 'Reunion semanal de grupo',
        departamentoId: 2,
        departamento: 'Dirigentes',
        descripcion: 'Encuentro de seguimiento',
        naturaleza: 'reunion',
        critico: true,
        programado: false,
        eventoId: null,
        publicoObjetivo: 'grupo-acampantes',
        politicaNotificacion: 'automatica-al-difundir',
      },
    ]);
  });

  it('calls transicion endpoint and parses updated event', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        id: 44,
        titulo: 'Reunion de grupo',
        descripcion: null,
        tipo: 'reunion',
        fechaInicio: '2026-03-13T19:00:00Z',
        fechaFin: '2026-03-13T20:00:00Z',
        ubicacion: null,
        estadoEvento: 'establecido',
      },
    });

    const result = await calendarioService.transicionarEstadoEvento(44, 'ESTABLECIDO');

    expect(mockedPost).toHaveBeenCalledWith('/calendario/eventos/44/transicion', {
      estadoDestino: 'ESTABLECIDO',
    });
    expect(result.estadoEvento).toBe('establecido');
  });
});