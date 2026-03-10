import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarCheck2, ShieldAlert } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { usePlanificacionAnual } from "../../../hooks/useCalendario";
import { useDepartamentos } from "../../../hooks/useDepartamentos";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { departmentScreens } from "./departamentoScreens";

export function DepartamentosHubPage() {
  const anioActual = new Date().getFullYear();
  const { departamentos, cargando: cargandoDepartamentos } = useDepartamentos();
  const { plantillas, cargando: cargandoPlanificacion } = usePlanificacionAnual(anioActual);

  const resumenPorCodigo = useMemo(() => {
    return departmentScreens.reduce<Record<string, { criticos: number; pendientes: number; programados: number }>>(
      (accumulator, screen) => {
        const departamento = departamentos.find((item) => item.codigo === screen.codigo);
        const plantillasDepartamento = departamento
          ? plantillas.filter((plantilla) => plantilla.departamentoId === departamento.id)
          : [];

        const pendientes = plantillasDepartamento.filter((plantilla) => !plantilla.programado).length;
        const criticos = plantillasDepartamento.filter(
          (plantilla) => plantilla.critico && !plantilla.programado
        ).length;

        accumulator[screen.codigo] = {
          criticos,
          pendientes,
          programados: plantillasDepartamento.length - pendientes,
        };

        return accumulator;
      },
      {}
    );
  }, [departamentos, plantillas]);

  const alertasCriticasTotales = useMemo(
    () => plantillas.filter((plantilla) => plantilla.critico && !plantilla.programado).length,
    [plantillas]
  );

  const pendientesTotales = useMemo(
    () => plantillas.filter((plantilla) => !plantilla.programado).length,
    [plantillas]
  );

  const cargando = cargandoDepartamentos || cargandoPlanificacion;

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-20 md:pb-8">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Departamentos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
                Hub operativo
              </Badge>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                  <Building2 className="h-8 w-8 text-orange-600" />
                  Departamentos
                </h1>
                <p className="max-w-3xl text-sm text-gray-600">
                  Entrá a cada área desde un único hub. Economía concentra además Tesorería y la definición de planes, para que la administración financiera deje de vivir como una navegación paralela.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                label="Alertas críticas"
                value={alertasCriticasTotales}
                accent={alertasCriticasTotales > 0 ? "red" : "emerald"}
              />
              <SummaryCard
                icon={<CalendarCheck2 className="h-4 w-4 text-orange-600" />}
                label="Pendientes totales"
                value={pendientesTotales}
                accent="orange"
              />
            </div>
          </div>

          <div
            className={cn(
              "mt-5 rounded-2xl border px-4 py-3 text-sm",
              alertasCriticasTotales > 0
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            )}
          >
            {alertasCriticasTotales > 0
              ? `Hay ${alertasCriticasTotales} alerta${alertasCriticasTotales === 1 ? "" : "s"} crítica${alertasCriticasTotales === 1 ? "" : "s"} sin programar en los canónicos del año.`
              : "No hay alertas críticas abiertas. Los canónicos críticos están cubiertos."}
          </div>
        </section>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
          </div>
        ) : (
          <section className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {departmentScreens.map((screen) => {
              const resumen = resumenPorCodigo[screen.codigo] ?? {
                criticos: 0,
                pendientes: 0,
                programados: 0,
              };
              const Icon = screen.icon;

              return (
                <Link
                  key={screen.codigo}
                  to={screen.path as never}
                  className={cn(
                    "group rounded-3xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                    screen.accentClass
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        <Icon className={cn("h-6 w-6", screen.iconClass)} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-900">{screen.nombre}</h2>
                          {resumen.criticos > 0 ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              {resumen.criticos} crítica{resumen.criticos === 1 ? "" : "s"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              Al día
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{screen.resumen}</p>
                      </div>
                    </div>

                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="border-white/70 bg-white/70 text-gray-700">
                      {resumen.programados} programados
                    </Badge>
                    <Badge variant="outline" className="border-white/70 bg-white/70 text-gray-700">
                      {resumen.pendientes} pendientes
                    </Badge>
                    {screen.codigo === "ECONOMIA" && (
                      <Badge variant="outline" className="border-white/70 bg-white/70 text-gray-700">
                        Incluye Tesorería y Planes
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-white/70 p-5 text-sm text-gray-600">
          Las reuniones con grupos siguen siendo una superficie separada: viven en <strong>Reuniones</strong> porque no pertenecen a ningún departamento.
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: "red" | "orange" | "emerald";
}) {
  const accentClass = {
    red: "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
    emerald: "border-emerald-200 bg-emerald-50",
  }[accent];

  return (
    <div className={cn("rounded-2xl border px-4 py-3", accentClass)}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}