import { useState } from 'react';
import { Plus, Tent, Search, Users } from 'lucide-react';
import { useCarpas } from '../../hooks/useCarpas';
import { ESTADO_CARPA_CONFIG } from '../../api/schemas/carpas';
import type { Carpa } from '../../api/schemas/carpas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { FormCarpa } from './FormCarpa';
import { RevisionesCarpa } from './RevisionesCarpa';

export function ListaCarpas() {
  const { carpas, cargando } = useCarpas();
  const [busqueda, setBusqueda] = useState('');
  const [showFormCarpa, setShowFormCarpa] = useState(false);
  const [carpaEditar, setCarpaEditar] = useState<Carpa | null>(null);
  const [carpaRevisiones, setCarpaRevisiones] = useState<Carpa | null>(null);

  const carpasFiltradas = carpas.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.modelo?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  if (carpaRevisiones) {
    return (
      <RevisionesCarpa
        carpa={carpaRevisiones}
        onVolver={() => setCarpaRevisiones(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="busqueda-carpas"
            placeholder="Buscar por nombre, marca o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          id="btn-nueva-carpa"
          onClick={() => {
            setCarpaEditar(null);
            setShowFormCarpa(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Carpa
        </Button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : carpasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Tent className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {busqueda ? 'No se encontraron carpas' : 'Aún no se cargaron carpas'}
          </p>
          {!busqueda && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowFormCarpa(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar la primera
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {carpasFiltradas.map((carpa) => (
            <CarpaCard
              key={carpa.id}
              carpa={carpa}
              onEditar={() => {
                setCarpaEditar(carpa);
                setShowFormCarpa(true);
              }}
              onVerRevisiones={() => setCarpaRevisiones(carpa)}
            />
          ))}
        </div>
      )}

      {/* Modal de crear/editar carpa */}
      <FormCarpa
        open={showFormCarpa}
        onClose={() => {
          setShowFormCarpa(false);
          setCarpaEditar(null);
        }}
        carpa={carpaEditar}
      />
    </div>
  );
}

function CarpaCard({
  carpa,
  onEditar,
  onVerRevisiones,
}: {
  carpa: Carpa;
  onEditar: () => void;
  onVerRevisiones: () => void;
}) {
  const ultima = carpa.ultimaRevision;
  const estadoConfig = ultima ? ESTADO_CARPA_CONFIG[ultima.estadoGeneral] : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onVerRevisiones}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Tent className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{carpa.nombre}</h3>
            {carpa.marca && (
              <p className="text-xs text-gray-500">
                {carpa.marca}
                {carpa.modelo ? ` - ${carpa.modelo}` : ''}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEditar();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          Editar
        </Button>
      </div>

      {carpa.capacidad && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Users className="w-3 h-3" />
          <span>{carpa.capacidad} personas</span>
        </div>
      )}

      {ultima && estadoConfig ? (
        <div className={`rounded-lg px-3 py-2 ${estadoConfig.bgColor} ${estadoConfig.borderColor} border`}>
          <div className="flex items-center justify-between">
            <Badge className={`${estadoConfig.bgColor} ${estadoConfig.textColor} border-0 text-xs`}>
              {estadoConfig.label}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(ultima.fechaRevision).toLocaleDateString('es-AR')}
            </span>
          </div>
          {ultima.revisorNombre && (
            <p className="text-xs text-gray-500 mt-1">
              Revisó: {ultima.revisorNombre}
            </p>
          )}
          {ultima.cantidadFotos > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              📷 {ultima.cantidadFotos} foto{ultima.cantidadFotos !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg px-3 py-2 bg-gray-50 border border-gray-200 text-center">
          <span className="text-xs text-gray-400">Sin revisiones</span>
        </div>
      )}
    </div>
  );
}
