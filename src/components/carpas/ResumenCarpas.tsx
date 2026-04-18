import { Tent, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { useResumenCarpas } from '../../hooks/useCarpas';

export function ResumenCarpas() {
  const { resumen, cargando } = useResumenCarpas();

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!resumen) return null;

  const cards = [
    {
      label: 'Total de carpas',
      value: resumen.totalCarpas,
      icon: Tent,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      iconColor: 'text-gray-500',
    },
    {
      label: 'Disponibles',
      value: resumen.disponibles,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Necesitan reparación',
      value: resumen.necesitanReparacion,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Fuera de servicio',
      value: resumen.fueraDeServicio,
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
    },
    {
      label: 'Sin revisar',
      value: resumen.sinRevisar,
      icon: HelpCircle,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bgColor} border ${card.borderColor} rounded-xl p-4 text-center`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${card.iconColor}`} />
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso visual */}
      {resumen.totalCarpas > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Distribución del estado
          </h3>
          <div className="flex rounded-full overflow-hidden h-4 bg-gray-100">
            {resumen.disponibles > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{
                  width: `${(resumen.disponibles / resumen.totalCarpas) * 100}%`,
                }}
                title={`${resumen.disponibles} disponibles`}
              />
            )}
            {resumen.necesitanReparacion > 0 && (
              <div
                className="bg-amber-500 transition-all"
                style={{
                  width: `${(resumen.necesitanReparacion / resumen.totalCarpas) * 100}%`,
                }}
                title={`${resumen.necesitanReparacion} necesitan reparación`}
              />
            )}
            {resumen.fueraDeServicio > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{
                  width: `${(resumen.fueraDeServicio / resumen.totalCarpas) * 100}%`,
                }}
                title={`${resumen.fueraDeServicio} fuera de servicio`}
              />
            )}
            {resumen.sinRevisar > 0 && (
              <div
                className="bg-blue-300 transition-all"
                style={{
                  width: `${(resumen.sinRevisar / resumen.totalCarpas) * 100}%`,
                }}
                title={`${resumen.sinRevisar} sin revisar`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Disponibles
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Reparación
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Fuera de servicio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
              Sin revisar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
