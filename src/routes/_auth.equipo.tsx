/**
 * Equipo Route
 * 
 * Página del módulo de Equipo de Montaña con tabs:
 * - Mi Equipo: Checklist personal
 * - Administrar: CRUD de categorías/items (solo DIRIGENTE/ADMIN)
 * - Reportes: Progreso de usuarios (solo DIRIGENTE/ADMIN)
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Backpack, Settings, BarChart3 } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { ChecklistEquipo, AdminEquipo, ReportesEquipo } from '../components/equipo';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export const Route = createFileRoute('/_auth/equipo')({
  component: EquipoPage,
});

function EquipoPage() {
  const { hasRole } = useAuth();
  const esAdmin = hasRole('ADMIN') || hasRole('DIRIGENTE');

  const [activeTab, setActiveTab] = useState('mi-equipo');

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8 mobile-screen-title">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Backpack className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Equipo de Montaña</h1>
          </div>
          <p className="text-gray-600">
            Prepara todo lo necesario para el campamento
          </p>
        </header>

        {/* Contenido con tabs */}
        {esAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="mi-equipo" className="flex items-center gap-2">
                <Backpack className="w-4 h-4" />
                Mi Equipo
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Administrar
              </TabsTrigger>
              <TabsTrigger value="reportes" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Reportes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mi-equipo">
              <ChecklistEquipo />
            </TabsContent>

            <TabsContent value="admin">
              <AdminEquipo />
            </TabsContent>

            <TabsContent value="reportes">
              <ReportesEquipo />
            </TabsContent>
          </Tabs>
        ) : (
          // Usuario normal: solo ve su checklist
          <ChecklistEquipo />
        )}
      </div>
    </div>
  );
}
