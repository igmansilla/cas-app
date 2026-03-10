/**
 * Store de Calendario
 * 
 * Gestiona el estado de UI del calendario usando TanStack Store.
 */

import { Store } from '@tanstack/store';
import type { EventoCalendarioFormateado, EventoRequest, PlantillaEventoAnual } from '../api/schemas/calendario';

interface CalendarioState {
  eventoSeleccionado: EventoCalendarioFormateado | null;
  modalDetalleAbierto: boolean;
  modalFormularioAbierto: boolean;
  modoEdicion: boolean;
  borradorEvento: Partial<EventoRequest>;
}

const BORRADOR_EVENTO_INICIAL: Partial<EventoRequest> = {
  titulo: "",
  descripcion: "",
  tipo: "actividad",
  fechaInicio: "",
  fechaFin: "",
  ubicacion: "",
  naturaleza: "EVENTO",
  periodicidad: "PUNTUAL",
  diaSemana: "",
  horaInicio: "15:00",
  horaFin: "17:00",
  grupoId: "",
  departamentoId: undefined,
  plantillaAnualId: undefined,
  enlaceVideollamada: "",
};

export const calendarioStore = new Store<CalendarioState>({
  eventoSeleccionado: null,
  modalDetalleAbierto: false,
  modalFormularioAbierto: false,
  modoEdicion: false,
  borradorEvento: BORRADOR_EVENTO_INICIAL,
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

  abrirModalCrear: () => {
    calendarioStore.setState((state) => ({
      ...state,
      modalFormularioAbierto: true,
      modoEdicion: false,
      borradorEvento: BORRADOR_EVENTO_INICIAL,
    }));
  },

  abrirModalEditar: () => {
    const { eventoSeleccionado } = calendarioStore.state;
    if (!eventoSeleccionado) return;

    const borrador: Partial<EventoRequest> = {
      titulo: eventoSeleccionado.title,
      descripcion: eventoSeleccionado.descripcion,
      tipo: eventoSeleccionado.tipo,
      fechaInicio: eventoSeleccionado.start.toISOString(),
      fechaFin: eventoSeleccionado.end.toISOString(),
      ubicacion: eventoSeleccionado.ubicacion || "",
      naturaleza: eventoSeleccionado.naturaleza,
      periodicidad: eventoSeleccionado.periodicidad,
      diaSemana: eventoSeleccionado.diaSemana,
      horaInicio: eventoSeleccionado.horaInicio,
      horaFin: eventoSeleccionado.horaFin,
      grupoId: eventoSeleccionado.grupoId,
      departamentoId: eventoSeleccionado.departamentoId ?? undefined,
      plantillaAnualId: eventoSeleccionado.plantillaAnualId ?? undefined,
      enlaceVideollamada: eventoSeleccionado.enlaceVideollamada,
    };

    calendarioStore.setState((state) => ({
      ...state,
      modalFormularioAbierto: true,
      modoEdicion: true,
      modalDetalleAbierto: false, // Cerrar modal de detalle si está abierto
      borradorEvento: borrador,
    }));
  },

  cerrarModalFormulario: () => {
    calendarioStore.setState((state) => ({
      ...state,
      modalFormularioAbierto: false,
      modoEdicion: false,
      borradorEvento: BORRADOR_EVENTO_INICIAL,
    }));
  },

  actualizarBorrador: (datos: Partial<EventoRequest>) => {
    calendarioStore.setState((state) => ({
      ...state,
      borradorEvento: { ...state.borradorEvento, ...datos },
    }));
  },
  
  reiniciarBorrador: () => {
    calendarioStore.setState((state) => ({
      ...state,
      borradorEvento: BORRADOR_EVENTO_INICIAL,
    }));
  },

  abrirModalCrearConPlantilla: (plantilla: PlantillaEventoAnual) => {
    calendarioStore.setState((state) => ({
      ...state,
      modalFormularioAbierto: true,
      modoEdicion: false,
      borradorEvento: {
        ...BORRADOR_EVENTO_INICIAL,
        tipo: plantilla.codigo,
        titulo: plantilla.etiqueta,
        descripcion: plantilla.descripcion,
        naturaleza: plantilla.naturaleza === 'reunion' ? 'REUNION' : 'EVENTO',
        departamentoId: plantilla.departamentoId,
        plantillaAnualId: plantilla.id,
      },
    }));
  },
};
