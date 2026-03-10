/**
 * CalendarioHeader Component
 * 
 * Header del calendario en modo consulta.
 */

interface CalendarioHeaderProps {
  diasRestantes?: number;
  error?: Error | null;
}

export function CalendarioHeader({ 
  diasRestantes, 
  error,
}: CalendarioHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            📅 Calendario de Actividades
          </h1>
          {diasRestantes !== undefined && diasRestantes > 0 && (
            <p className="text-gray-600 mt-1">
              ¡Faltan <span className="font-semibold text-orange-600">{diasRestantes} días</span> para el campamento!
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error al cargar eventos</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}
    </header>
  );
}
