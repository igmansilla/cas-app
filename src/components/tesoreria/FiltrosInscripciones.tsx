import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../ui/sheet';
import { usePlanes } from '../../hooks/usePagos';
import { EstadoInscripcion, EstadoFinanciero, type AdminInscripcionFilters } from '../../api/schemas/pagos';
import { cn } from '../../lib/utils';

interface FiltrosInscripcionesProps {
  filters: AdminInscripcionFilters;
  onFiltersChange: (filters: AdminInscripcionFilters) => void;
}

// Filter chip component for mobile
function FilterChip({ 
  label, 
  selected, 
  onClick 
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
        "border active:scale-95",
        selected 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-background text-foreground border-input hover:bg-muted"
      )}
    >
      {selected && <Check className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/**
 * Filter bar for admin inscriptions table.
 * Mobile: shows search + filter button that opens a sheet with chip-based filters
 * Desktop: shows all filters inline with selects
 */
export function FiltrosInscripciones({ filters, onFiltersChange }: FiltrosInscripcionesProps) {
  const { planes } = usePlanes();
  const [searchValue, setSearchValue] = useState(filters.q || '');
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Local state for sheet filters
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);
  const [selectedEstadoInscripcion, setSelectedEstadoInscripcion] = useState<EstadoInscripcion | undefined>(undefined);
  const [selectedEstadoFinanciero, setSelectedEstadoFinanciero] = useState<EstadoFinanciero | undefined>(undefined);

  // Track if we just opened the sheet
  const justOpened = useRef(false);

  // Sync local state when sheet opens
  const handleOpenSheet = useCallback(() => {
    setSelectedPlan(filters.plan);
    setSelectedEstadoInscripcion(filters.estadoInscripcion);
    setSelectedEstadoFinanciero(filters.estadoFinanciero);
    justOpened.current = true;
    setSheetOpen(true);
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.q) {
        onFiltersChange({ ...filters, q: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Count active filters (excluding search)
  const activeFilterCount = [
    filters.plan,
    filters.estadoInscripcion,
    filters.estadoFinanciero
  ].filter(Boolean).length;

  const handleApplyFilters = useCallback(() => {
    onFiltersChange({ 
      q: searchValue || undefined,
      plan: selectedPlan,
      estadoInscripcion: selectedEstadoInscripcion,
      estadoFinanciero: selectedEstadoFinanciero
    });
    setSheetOpen(false);
  }, [selectedPlan, selectedEstadoInscripcion, selectedEstadoFinanciero, searchValue, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setSelectedPlan(undefined);
    setSelectedEstadoInscripcion(undefined);
    setSelectedEstadoFinanciero(undefined);
  }, []);

  const estadosInscripcion = [
    { value: EstadoInscripcion.ACTIVA, label: 'Activa' },
    { value: EstadoInscripcion.MOVIDA_PLAN_B, label: 'Plan B' },
    { value: EstadoInscripcion.MOVIDA_PLAN_C, label: 'Plan C' },
    { value: EstadoInscripcion.CANCELADA, label: 'Cancelada' }
  ];

  const estadosFinanciero = [
    { value: EstadoFinanciero.AL_DIA, label: '🟢 Al día' },
    { value: EstadoFinanciero.MOROSO, label: '🔴 Moroso' },
    { value: EstadoFinanciero.MIGRADO, label: '⚠️ Migrado' }
  ];

  const hasLocalFilters = selectedPlan || selectedEstadoInscripcion || selectedEstadoFinanciero;

  return (
    <>
      {/* Mobile: Search + Filter Button */}
      <div className="flex gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleOpenSheet}
          className="relative shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Desktop: Inline filters with selects */}
      <div className="hidden md:flex gap-3 items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI o email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select 
          value={filters.plan || 'all'} 
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            plan: value === 'all' ? undefined : value 
          })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los planes</SelectItem>
            {planes.map((plan) => (
              <SelectItem key={plan.id} value={plan.codigo}>
                {plan.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.estadoInscripcion || 'all'} 
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            estadoInscripcion: value === 'all' ? undefined : value as EstadoInscripcion 
          })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value={EstadoInscripcion.ACTIVA}>Activa</SelectItem>
            <SelectItem value={EstadoInscripcion.MOVIDA_PLAN_B}>Migrada Plan B</SelectItem>
            <SelectItem value={EstadoInscripcion.MOVIDA_PLAN_C}>Migrada Plan C</SelectItem>
            <SelectItem value={EstadoInscripcion.CANCELADA}>Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.estadoFinanciero || 'all'} 
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            estadoFinanciero: value === 'all' ? undefined : value as EstadoFinanciero 
          })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Deuda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value={EstadoFinanciero.AL_DIA}>🟢 Al día</SelectItem>
            <SelectItem value={EstadoFinanciero.MOROSO}>🔴 Moroso</SelectItem>
            <SelectItem value={EstadoFinanciero.MIGRADO}>⚠️ Migrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Filter Sheet with Chips */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <div className="px-2">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Toca para seleccionar o deseleccionar
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-8">
              {/* Plan filter */}
              {planes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Plan de Pago</h4>
                  <div className="flex flex-wrap gap-3">
                    {planes.map((plan) => (
                      <FilterChip
                        key={plan.id}
                        label={plan.nombre}
                        selected={selectedPlan === plan.codigo}
                        onClick={() => setSelectedPlan(
                          selectedPlan === plan.codigo ? undefined : plan.codigo
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Estado inscripción filter */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Estado de Inscripción</h4>
                <div className="flex flex-wrap gap-3">
                  {estadosInscripcion.map((estado) => (
                    <FilterChip
                      key={estado.value}
                      label={estado.label}
                      selected={selectedEstadoInscripcion === estado.value}
                      onClick={() => setSelectedEstadoInscripcion(
                        selectedEstadoInscripcion === estado.value ? undefined : estado.value
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Estado financiero filter */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Estado Financiero</h4>
                <div className="flex flex-wrap gap-3">
                  {estadosFinanciero.map((estado) => (
                    <FilterChip
                      key={estado.value}
                      label={estado.label}
                      selected={selectedEstadoFinanciero === estado.value}
                      onClick={() => setSelectedEstadoFinanciero(
                        selectedEstadoFinanciero === estado.value ? undefined : estado.value
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row gap-3 pt-4 pb-6 border-t">
              <Button 
                variant="ghost" 
                onClick={handleClearFilters}
                className="flex-1"
                disabled={!hasLocalFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
              <Button 
                onClick={handleApplyFilters}
                className="flex-1"
              >
                Aplicar
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
