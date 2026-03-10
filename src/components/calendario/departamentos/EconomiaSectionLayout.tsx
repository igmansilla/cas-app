import { Link } from "@tanstack/react-router";
import { ArrowRight, BookMarked, Building2, Receipt, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { usePlanificacionAnual } from "../../../hooks/useCalendario";
import { useDepartamentos } from "../../../hooks/useDepartamentos";
import { useAuth } from "../../../hooks/useAuth";
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

export type EconomiaSectionTab = "hub" | "planificacion" | "tesoreria" | "planes";

interface EconomiaSectionLayoutProps {
  currentTab: EconomiaSectionTab;
  children?: ReactNode;
}

export function EconomiaSectionLayout({ currentTab, children }: EconomiaSectionLayoutProps) {
  const { hasGroup, hasRole } = useAuth();
  const anioActual = new Date().getFullYear();
  const { departamentos } = useDepartamentos();
  const { plantillas } = usePlanificacionAnual(anioActual);

  const canAccessTesoreria = hasRole("admin") || hasRole("tesorero") || hasRole("revisor");
  const canManagePlanes = hasGroup("CONSEJO") || hasRole("admin");

  const departamentoEconomia = useMemo(
    () => departamentos.find((departamento) => departamento.codigo === "ECONOMIA"),
    [departamentos]
  );

  const criticosPendientes = useMemo(() => {
    if (!departamentoEconomia) {
      return 0;
    }

    return plantillas.filter(
      (plantilla) =>
        plantilla.departamentoId === departamentoEconomia.id &&
        plantilla.critico &&
        !plantilla.programado
    ).length;
  }, [departamentoEconomia, plantillas]);

  const pendientesTotales = useMemo(() => {
    if (!departamentoEconomia) {
      return 0;
    }

    return plantillas.filter(
      (plantilla) => plantilla.departamentoId === departamentoEconomia.id && !plantilla.programado
    ).length;
  }, [departamentoEconomia, plantillas]);

  const tabLabel = {
    hub: "Economía",
    planificacion: "Planificación",
    tesoreria: "Tesorería",
    planes: "Planes",
  }[currentTab];

  const navItems = [
    { key: "hub", label: "Sección", to: "/departamentos/economia", visible: true },
    { key: "planificacion", label: "Planificación", to: "/departamentos/economia/planificacion", visible: true },
    { key: "tesoreria", label: "Tesorería", to: "/departamentos/economia/tesoreria", visible: canAccessTesoreria },
    { key: "planes", label: "Planes", to: "/departamentos/economia/planes", visible: canManagePlanes },
  ] as const;

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-20 md:pb-8">
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
                <BreadcrumbLink asChild>
                  <Link to="/departamentos">Departamentos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {currentTab === "hub" ? (
                  <BreadcrumbPage>Economía</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to="/departamentos/economia">Economía</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {currentTab !== "hub" && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{tabLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
                Sección financiera
              </Badge>
              <div className="space-y-2">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                  <Building2 className="h-8 w-8 text-emerald-600" />
                  Economía
                </h1>
                <p className="max-w-3xl text-sm text-gray-600">
                  Esta sección agrupa la planificación del área, la operatoria de Tesorería y la definición de planes. La administración financiera deja de estar repartida entre rutas planas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {criticosPendientes > 0 ? (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  {criticosPendientes} alerta{criticosPendientes === 1 ? "" : "s"} crítica{criticosPendientes === 1 ? "" : "s"}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Sin alertas críticas
                </Badge>
              )}
              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                {pendientesTotales} pendiente{pendientesTotales === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          {criticosPendientes > 0 && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Hay {criticosPendientes} canónico{criticosPendientes === 1 ? "" : "s"} crítico{criticosPendientes === 1 ? "" : "s"} de Economía sin programar.
              {currentTab !== "planificacion" && (
                <Link to="/departamentos/economia/planificacion" className="ml-2 font-semibold underline underline-offset-2">
                  Revisar planificación
                </Link>
              )}
            </div>
          )}
        </section>

        <nav className="mt-6 rounded-3xl border border-emerald-100 bg-white/85 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {navItems.filter((item) => item.visible).map((item) => (
              <Link
                key={item.key}
                to={item.to as never}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                  currentTab === item.key
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {currentTab === "hub" ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <OverviewCard
              title="Planificación"
              description="Canónicos del área, reuniones internas y alertas críticas de eventos no programados."
              to="/departamentos/economia/planificacion"
              icon={<ShieldAlert className="h-5 w-5 text-emerald-600" />}
              badge={
                criticosPendientes > 0
                  ? `${criticosPendientes} crítica${criticosPendientes === 1 ? "" : "s"}`
                  : "Al día"
              }
              critical={criticosPendientes > 0}
            />

            {canAccessTesoreria && (
              <OverviewCard
                title="Tesorería"
                description="Cobranza, auditoría de inscripciones y configuración del tipo de comprobante emitido."
                to="/departamentos/economia/tesoreria"
                icon={<Receipt className="h-5 w-5 text-emerald-600" />}
              />
            )}

            {canManagePlanes && (
              <OverviewCard
                title="Planes"
                description="Definición y mantenimiento de planes de pago dentro del mismo flujo de Economía."
                to="/departamentos/economia/planes"
                icon={<BookMarked className="h-5 w-5 text-emerald-600" />}
              />
            )}
          </section>
        ) : (
          <div className="mt-6">{children}</div>
        )}
      </div>
    </div>
  );
}

interface OverviewCardProps {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  badge?: string;
  critical?: boolean;
}

function OverviewCard({ title, description, to, icon, badge, critical = false }: OverviewCardProps) {
  return (
    <Link
      to={to as never}
      className={cn(
        "group rounded-3xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        critical ? "border-red-200 bg-red-50/30" : "border-emerald-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
            {icon}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {badge && (
                <Badge
                  className={cn(
                    critical
                      ? "bg-red-100 text-red-700 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  )}
                >
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function EconomiaSectionDenied({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-10 text-center">
      <p className="text-base font-medium text-gray-800">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}