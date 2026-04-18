/**
 * Carpas Route
 *
 * Página del módulo de Revisión de Carpas con tabs:
 * - Carpas: Lista con CRUD y acceso a revisiones
 * - Resumen: Dashboard con estadísticas
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tent, BarChart3 } from 'lucide-react';

import { ListaCarpas, ResumenCarpas } from '../components/carpas';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export const Route = createFileRoute('/_auth/carpas')({
  component: CarpasPage,
});

function CarpasPage() {
  const [activeTab, setActiveTab] = useState('carpas');

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8 mobile-screen-title">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Tent className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Revisión de Carpas</h1>
          </div>
          <p className="text-gray-600">
            Registrá y consultá el estado de las carpas del campamento
          </p>
        </header>

        {/* Contenido con tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="carpas" className="flex items-center gap-2">
              <Tent className="w-4 h-4" />
              Carpas
            </TabsTrigger>
            <TabsTrigger value="resumen" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Resumen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carpas">
            <ListaCarpas />
          </TabsContent>

          <TabsContent value="resumen">
            <ResumenCarpas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
