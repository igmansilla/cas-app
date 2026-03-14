/**
 * Documentos Route
 *
 * Página del módulo de Documentación con tabs:
 * - Mis Documentos: Checklist personal de documentos
 * - Reportes: Estado de documentación de usuarios (solo DIRIGENTE/SECRETARIO/ADMIN)
 * - Configuración: Administrar tipos de documento (solo ADMIN)
 */

import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { FileText, BarChart3, Settings, FilePen } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useUsuarioActual } from '../hooks/useUsuarioActual';
import { MisDocumentos, ReportesDocumentos, AdminDocumentos, FormularioDocumento, DetalleDocumentosUsuario } from '../components/documentos';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export const Route = createFileRoute('/_auth/documentos')({
  component: DocumentosPage,
});

function DocumentosPage() {
  const { hasRole } = useAuth();
  const { data: usuario } = useUsuarioActual();
  const esAdmin = hasRole('ADMIN') || hasRole('DIRIGENTE') || hasRole('SECRETARIO');
  const puedeConfigurar = hasRole('ADMIN');

  const [activeTab, setActiveTab] = useState('mis-documentos');
  
  // Estado para el formulario de documento
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<{
    tipoDocumentoId: number;
    keycloakId: string;
  } | null>(null);

  // Estado para ver detalle de usuario (desde reportes)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<{
    keycloakId: string;
    usuarioNombre?: string;
  } | null>(null);

  const handleSelectDocumento = (tipoDocumentoId: number, keycloakId: string) => {
    setDocumentoSeleccionado({ tipoDocumentoId, keycloakId });
  };

  const handleCloseFormulario = () => {
    setDocumentoSeleccionado(null);
  };

  const handleSelectUsuario = (keycloakId: string, usuarioNombre?: string) => {
    setUsuarioSeleccionado({ keycloakId, usuarioNombre });
  };

  const handleCloseDetalleUsuario = () => {
    setUsuarioSeleccionado(null);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-2">
            <div className="flex items-center gap-3 mobile-screen-title">
              <div className="p-2 bg-orange-100 rounded-xl shrink-0">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documentación</h1>
            </div>
            {puedeConfigurar && (
              <Link
                to="/template-editor"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm w-full sm:w-auto shrink-0 transition-colors"
              >
                <FilePen className="w-4 h-4" />
                Editor de Templates
              </Link>
            )}
          </div>
          <p className="mobile-screen-title text-gray-600 text-sm md:text-base">
            Completa los documentos requeridos para el campamento
          </p>
        </header>

        {/* Contenido con tabs */}
        {esAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex flex-wrap h-auto w-full justify-start gap-1 p-1 bg-white md:bg-gray-100/50">
              <TabsTrigger value="mis-documentos" className="flex items-center gap-2 flex-1 md:flex-none text-xs md:text-sm">
                <FileText className="w-4 h-4 hidden sm:block" />
                Mis Documentos
              </TabsTrigger>
              <TabsTrigger value="reportes" className="flex items-center gap-2 flex-1 md:flex-none text-xs md:text-sm">
                <BarChart3 className="w-4 h-4 hidden sm:block" />
                Reportes
              </TabsTrigger>
              {puedeConfigurar && (
                <TabsTrigger value="admin" className="flex items-center gap-2 flex-1 md:flex-none text-xs md:text-sm">
                  <Settings className="w-4 h-4 hidden sm:block" />
                  Configuración
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="mis-documentos">
              <MisDocumentos onSelectDocumento={handleSelectDocumento} />
            </TabsContent>

            <TabsContent value="reportes">
              <ReportesDocumentos onSelectUsuario={handleSelectUsuario} />
            </TabsContent>

            {puedeConfigurar && (
              <TabsContent value="admin">
                <AdminDocumentos />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          // Usuario normal: solo ve sus documentos
          <MisDocumentos onSelectDocumento={handleSelectDocumento} />
        )}
      </div>

      {/* Modal de formulario de documento */}
      {documentoSeleccionado && usuario && (
        <FormularioDocumento
          tipoDocumentoId={documentoSeleccionado.tipoDocumentoId}
          keycloakId={documentoSeleccionado.keycloakId}
          usuarioId={usuario.id}
          onClose={handleCloseFormulario}
        />
      )}

      {/* Modal de detalle de documentos de usuario (para reportes) */}
      {usuarioSeleccionado && (
        <DetalleDocumentosUsuario
          keycloakId={usuarioSeleccionado.keycloakId}
          usuarioNombre={usuarioSeleccionado.usuarioNombre}
          onClose={handleCloseDetalleUsuario}
        />
      )}
    </div>
  );
}
