/**
 * CalendarioLegend Component
 * 
 * Leyenda de tipos de evento
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { obtenerColorEvento, obtenerIconoEvento } from "./helpers";
import type { TipoEvento } from "../../api/schemas/calendario";

interface CalendarioLegendProps {
  tiposEvento: TipoEvento[] | undefined;
}

export function CalendarioLegend({ tiposEvento }: CalendarioLegendProps) {
  // Tipos de eventos para mostrar en la leyenda
  const tiposEventoParaMostrar = useMemo(() => {
    // Si no hay tipos provistos por la API, no mostrar ningún tipo
    const tipos = Array.isArray(tiposEvento) ? tiposEvento : [];

    // Deduplicar por value usando Map para mantener el primer valor
    const tiposUnicos = new Map<string, TipoEvento>();
    tipos.forEach((t) => {
      if (!tiposUnicos.has(t.codigo)) {
        tiposUnicos.set(t.codigo, t);
      }
    });
    
    return Array.from(tiposUnicos.values());
  }, [tiposEvento]);

  if (tiposEventoParaMostrar.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800">
          Tipos de eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiposEventoParaMostrar.map((tipo) => (
            <div key={tipo.codigo} className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="gap-2 px-3 py-1 font-normal text-sm"
                style={{ 
                  borderColor: obtenerColorEvento(tipo.codigo),
                  backgroundColor: `${obtenerColorEvento(tipo.codigo)}10`
                }}
              >
                <span style={{ color: obtenerColorEvento(tipo.codigo) }}>
                  {obtenerIconoEvento(tipo.codigo)}
                </span>
                <span className="text-gray-700">
                  {tipo.etiqueta}
                </span>
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

