import { Link, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { Backpack, Building2, ChevronRight, FileText, ShieldAlert, Users, UsersRound } from "lucide-react";
import { FamiliaWidget } from "../components/familia/FamiliaWidget";
import { groupsScreen } from "../components/calendario/departamentos/departamentoScreens";
import { usePlanificacionAnual } from "../hooks/useCalendario";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { hasRole, hasGroup } = useAuth();
  
  // Check if user can access user management (DIRIGENTE or CONSEJO)
  const canAccessUsuarios = hasRole('dirigente') || hasGroup('CONSEJO') || hasRole('admin');
  const canAccessPlanificacion = hasRole('dirigente') || hasRole('admin');
  const anioActual = new Date().getFullYear();
  const { plantillas } = usePlanificacionAnual(anioActual, canAccessPlanificacion);
  const alertasCriticas = plantillas.filter(
    (plantilla) => plantilla.naturaleza === 'evento' && plantilla.critico && !plantilla.programado
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al campamento</p>
      </div>

      {/* Mi Grupo Familiar - visible para todos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Mi Familia</h2>
        <FamiliaWidget />
      </section>

      {/* Mi Equipo - visible para todos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Mi Equipo</h2>
        <Link 
          to="/equipo"
          className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-teal-200 dark:border-teal-800 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <Backpack className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-teal-900 dark:text-teal-100">
                Checklist de Equipo
              </h3>
              <p className="text-sm text-teal-700 dark:text-teal-300">
                Preparación para el campamento
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Documentación - visible para todos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Documentación</h2>
        <Link 
          to="/documentos"
          className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
              <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                Mis Documentos
              </h3>
              <p className="text-sm text-rose-700 dark:text-rose-300">
                Formularios y autorizaciones del campamento
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Planificación - visible para dirigentes/admin */}
      {canAccessPlanificacion && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Planificación</h2>

          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-3 text-sm text-orange-900">
            {hasRole('admin')
              ? 'Como admin, desde acá podés entrar a las pantallas operativas de departamentos y reuniones. El calendario general queda unificado en el footer.'
              : 'Desde acá podés entrar a las pantallas operativas de departamentos y reuniones. El calendario general queda unificado en el footer.'}
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Link
              to="/departamentos"
              className="flex items-center justify-between rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-orange-900">Departamentos</h3>
                    {alertasCriticas > 0 && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                        {alertasCriticas} crítica{alertasCriticas === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-orange-700">
                    Entrá al hub operativo y navegá cada área desde un solo lugar. Economía concentra Tesorería y Planes.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to={groupsScreen.path as any}
              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
                  <UsersRound className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">{groupsScreen.nombre}</h3>
                  <p className="text-sm text-emerald-700">{groupsScreen.resumen}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* Admin Quick Access */}
      {canAccessUsuarios && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Administración</h2>

          {/* Usuarios - For DIRIGENTE and CONSEJO */}
          {canAccessUsuarios && (
            <Link 
              to="/usuarios"
              className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Acampantes y grupos
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Gestión de acampantes, jerarquía y asignaciones
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
