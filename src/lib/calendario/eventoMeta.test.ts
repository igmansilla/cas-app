import { describe, expect, it } from 'vitest';

import {
  POLITICA_NOTIFICACION_OPTIONS,
  PUBLICO_OBJETIVO_OPTIONS,
  getEstadoEventoBadge,
  getPoliticaNotificacionBadge,
  getPublicoObjetivoBadge,
} from './eventoMeta';

describe('eventoMeta helpers', () => {
  it('exposes expected publico objetivo options', () => {
    expect(PUBLICO_OBJETIVO_OPTIONS.map((option) => option.value)).toEqual([
      'comunidad',
      'dirigentes',
      'consejo',
      'padres',
      'acampantes',
      'padres-y-acampantes',
      'grupo-acampantes',
      'grupo-y-padres',
    ]);
  });

  it('exposes expected politica notificacion options', () => {
    expect(POLITICA_NOTIFICACION_OPTIONS.map((option) => option.value)).toEqual([
      'automatica-al-difundir',
      'manual',
      'sin-notificacion',
    ]);
  });

  it('normalizes known publico objetivo values', () => {
    expect(getPublicoObjetivoBadge('  COMUNIDAD  ')).toEqual({
      label: 'Comunidad',
      className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50',
    });
  });

  it('returns fallback metadata for unknown publico objetivo values', () => {
    expect(getPublicoObjetivoBadge('zona_sur')).toEqual({
      label: 'Zona Sur',
      className: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100',
    });
    expect(getPublicoObjetivoBadge(null).label).toBe('Sin definir');
  });

  it('returns known badges for politica notificacion and estado evento', () => {
    expect(getPoliticaNotificacionBadge('manual')).toEqual({
      label: 'Manual',
      className: 'bg-blue-50 text-blue-700 hover:bg-blue-50',
    });
    expect(getEstadoEventoBadge('difundido')).toEqual({
      label: 'Difundido',
      className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
    });
  });
});