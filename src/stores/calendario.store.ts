/**
 * Store de Calendario
 * 
 * Gestiona el estado de UI del calendario usando TanStack Store.
 */

import { Store } from '@tanstack/store';
import type { EventoCalendarioFormateado } from '../api/schemas/calendario';

interface CalendarioState {
  eventoSeleccionado: EventoCalendarioFormateado | null;
  modalDetalleAbierto: boolean;
}

export const calendarioStore = new Store<CalendarioState>({
  eventoSeleccionado: null,
  modalDetalleAbierto: false,
});

export const calendarioAcciones = {
  abrirModalDetalle: (evento: EventoCalendarioFormateado) => {
    calendarioStore.setState((state) => ({
      ...state,
      eventoSeleccionado: evento,
      modalDetalleAbierto: true,
    }));
  },

  cerrarModalDetalle: () => {
    calendarioStore.setState((state) => ({
      ...state,
      modalDetalleAbierto: false,
      eventoSeleccionado: null,
    }));
  },
};
