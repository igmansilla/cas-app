import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { type PlanPago, AudienciaPlan } from "../../api/schemas/pagos";
import { PencilIcon, PowerIcon, MoreHorizontal, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getAudienciaInfo } from "./utils/audienciaUtils";

interface TablaPlanesProps {
  planes: PlanPago[];
  onEditar: (plan: PlanPago) => void;
  onToggleEstado?: (plan: PlanPago) => void;
}

export function TablaPlanes({ planes, onEditar, onToggleEstado }: TablaPlanesProps) {
  if (planes.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No hay planes configurados.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {planes.map((plan) => (
          <PlanCard
            key={plan.codigo}
            plan={plan}
            onEditar={onEditar}
            onToggleEstado={onToggleEstado}
          />
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Audiencia</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Cuotas</TableHead>
              <TableHead>Monto Total</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planes.map((plan) => {
              const audienciaInfo = getAudienciaInfo(plan.audiencia as AudienciaPlan | undefined);
              const AudienciaIcon = audienciaInfo.icon;
              return (
                <TableRow key={plan.codigo}>
                  <TableCell className="font-medium">{plan.codigo}</TableCell>
                  <TableCell>{plan.nombre}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${audienciaInfo.bgClass} ${audienciaInfo.textClass} ${audienciaInfo.borderClass} flex items-center gap-1 w-fit`}
                    >
                      <AudienciaIcon className="w-3 h-3" />
                      {audienciaInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{plan.anio}</TableCell>
                  <TableCell>
                    {plan.minCuotas === plan.maxCuotas
                      ? plan.maxCuotas
                      : `${plan.minCuotas} - ${plan.maxCuotas}`}
                  </TableCell>
                  <TableCell>${plan.montoTotal.toLocaleString()}</TableCell>
                  <TableCell>{plan.mesInicio} - {plan.mesFin}</TableCell>
                  <TableCell>
                    <Badge variant={plan.activo ? "default" : "secondary"}>
                      {plan.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu plan={plan} onEditar={onEditar} onToggleEstado={onToggleEstado} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PlanCard({ plan, onEditar, onToggleEstado }: { plan: PlanPago } & Omit<TablaPlanesProps, 'planes'>) {
  const audienciaInfo = getAudienciaInfo(plan.audiencia as AudienciaPlan | undefined);
  const AudienciaIcon = audienciaInfo.icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{plan.nombre}</CardTitle>
          <p className="text-xs text-muted-foreground">{plan.codigo} • {plan.anio}</p>
        </div>
        <ActionsMenu plan={plan} onEditar={onEditar} onToggleEstado={onToggleEstado} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Monto Total</span>
            <span className="font-medium">${plan.montoTotal.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Cuotas</span>
            <span>{plan.minCuotas === plan.maxCuotas ? plan.maxCuotas : `${plan.minCuotas}-${plan.maxCuotas}`} avail.</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 mt-2 pt-2 border-t text-muted-foreground text-xs">
            <CalendarIcon className="w-3 h-3" />
            <span>Vigencia: {plan.mesInicio} - {plan.mesFin}</span>
          </div>
          <div className="col-span-2 mt-1 flex flex-wrap gap-2">
            <Badge variant={plan.activo ? "default" : "secondary"} className="w-fit">
              {plan.activo ? "Activo" : "Inactivo"}
            </Badge>
            {/* Chip de Audiencia */}
            <Badge
              variant="outline"
              className={`${audienciaInfo.bgClass} ${audienciaInfo.textClass} ${audienciaInfo.borderClass} flex items-center gap-1 w-fit`}
            >
              <AudienciaIcon className="w-3 h-3" />
              {audienciaInfo.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionsMenu({ plan, onEditar, onToggleEstado }: { plan: PlanPago } & Omit<TablaPlanesProps, 'planes'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEditar(plan)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Editar Plan
        </DropdownMenuItem>
        {onToggleEstado && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleEstado(plan)}>
              <PowerIcon className="mr-2 h-4 w-4" />
              {plan.activo ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
