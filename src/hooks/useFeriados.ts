import { useQuery } from "@tanstack/react-query";
import type { EventoCalendarioFormateado } from "../api/schemas/calendario";

interface FeriadoDto {
  fecha: string;
  tipo: string;
  nombre: string;
}

const fetchFeriados = async (anio: number): Promise<EventoCalendarioFormateado[]> => {
  const response = await fetch(`https://api.argentinadatos.com/v1/feriados/${anio}`);
  if (!response.ok) {
    if (response.status === 404) {
      return []; // Si no hay datos para el año aún, devolvemos vacío
    }
    throw new Error("Error al obtener feriados Nacionales");
  }
  
  const data: FeriadoDto[] = await response.json();
  
  return data.map((f) => {
    // La fecha viene en formato 'YYYY-MM-DD'
    const [year, month, day] = f.fecha.split('-').map(Number);
    // Cuidado con la zona horaria, creamos la fecha al mediodía local para evitar cambios por UTC
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    return {
      id: `feriado-${f.fecha}`,
      realId: 0,
      title: f.nombre,
      descripcion: `Feriado ${f.tipo}`,
      naturaleza: "EVENTO",
      start: date,
      end: date,
      allDay: true,
      tipo: "feriado", // Esto gatillará el color celeste
      estado: "PUBLICADO",
    };
  });
};

export function useFeriados(anio: number) {
  return useQuery({
    queryKey: ["feriados", anio],
    queryFn: () => fetchFeriados(anio),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 días (los feriados cambian muy poco)
    retry: 2,
  });
}
