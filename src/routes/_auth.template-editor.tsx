/**
 * Template Editor Page
 * 
 * Página de administración para crear y editar templates de PDF.
 * Accesible solo para ADMIN/SECRETARIO.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { PdfTemplateEditor, type TemplateConfig } from '../components/documentos/PdfTemplateEditor';
import { pdfTemplatesService, type CampoDisponible, type PdfTemplateResponse } from '../api/services/pdfTemplates';
import * as v from 'valibot';

const searchSchema = v.object({
  tipoDocumentoId: v.optional(v.number()),
  tipoDocumentoNombre: v.optional(v.string()),
});

export const Route = createFileRoute('/_auth/template-editor')({
  component: TemplateEditorPage,
  validateSearch: (search) => v.parse(searchSchema, search),
});

type ViewMode = 'list' | 'editor';

function TemplateEditorPage() {
  const navigate = useNavigate();
  const { tipoDocumentoId, tipoDocumentoNombre } = useSearch({ from: '/_auth/template-editor' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [templates, setTemplates] = useState<PdfTemplateResponse[]>([]);
  const [templateEditar, setTemplateEditar] = useState<TemplateConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [campos, setCampos] = useState<CampoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar templates y campos disponibles
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const templatesData = await pdfTemplatesService.listar();
        // Si tenemos tipoDocumentoId, cargar campos específicos del formulario
        const camposData = tipoDocumentoId 
          ? await pdfTemplatesService.getCamposDisponiblesPorTipo(tipoDocumentoId)
          : await pdfTemplatesService.getCamposDisponibles();
        setTemplates(templatesData);
        setCampos(camposData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [tipoDocumentoId]);

  const handleNuevoTemplate = () => {
    setTemplateEditar(null);
    setViewMode('editor');
  };

  const handleEditarTemplate = async (template: PdfTemplateResponse) => {
    console.log('🔍 [DEBUG] Editando template:', template.codigo);
    
    // Primero verificar si este template está asociado a un TipoDocumento
    const asociado = await pdfTemplatesService.getTipoDocumentoAsociado(template.codigo);
    console.log('🔍 [DEBUG] Asociación encontrada:', asociado);
    
    // Si tiene un TipoDocumento asociado, cargar sus campos
    if (asociado?.tieneAsociado && asociado.tipoDocumentoId) {
      console.log('🔍 [DEBUG] Cargando campos del TipoDocumento:', asociado.tipoDocumentoId);
      try {
        const camposConFormulario = await pdfTemplatesService.getCamposDisponiblesPorTipo(asociado.tipoDocumentoId);
        console.log('🔍 [DEBUG] Campos cargados:', camposConFormulario);
        setCampos(camposConFormulario);
      } catch (err) {
        console.error('❌ [DEBUG] Error cargando campos del formulario:', err);
      }
    } else {
      console.log('🔍 [DEBUG] Template NO está asociado a ningún TipoDocumento');
    }
    
    const config: TemplateConfig = {
      codigo: template.codigo,
      nombre: template.nombre,
      pdfBase64: template.pdfBase64,
      pageWidth: template.pageWidth,
      pageHeight: template.pageHeight,
      campos: template.campos.map(c => ({
        codigo: c.codigo,
        nombre: c.nombre,
        x: c.x,
        y: c.y,
        fontSize: c.fontSize,
        tipo: c.tipo as 'texto' | 'checkbox' | 'fecha' | 'marker' | 'fijo',
        valorFijo: c.valorFijo,
      })),
    };
    setTemplateEditar(config);
    setViewMode('editor');
  };

  const handleEliminarTemplate = async (codigo: string) => {
    if (!confirm('¿Estás seguro de eliminar este template?')) return;
    
    try {
      await pdfTemplatesService.eliminar(codigo);
      setTemplates(templates.filter(t => t.codigo !== codigo));
    } catch (err) {
      console.error('Error eliminando template:', err);
      alert('Error al eliminar el template');
    }
  };

  const handleSave = async (config: TemplateConfig) => {
    try {
      await pdfTemplatesService.guardar(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Recargar lista
      const templatesData = await pdfTemplatesService.listar();
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error guardando template:', err);
    }
  };

  const handleVolver = () => {
    if (viewMode === 'editor') {
      setViewMode('list');
      setTemplateEditar(null);
    } else {
      navigate({ to: '/documentos' });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate({ to: '/documentos' })}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          onClick={handleVolver}
          className="p-2 hover:bg-white/10 rounded-lg shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-[200px] mobile-screen-title">
          <h1 className="text-base sm:text-lg font-semibold truncate">
            {viewMode === 'list' ? 'Templates PDF' : templateEditar ? `Editando: ${templateEditar.nombre}` : 'Nuevo Template'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
            <span className="truncate">{viewMode === 'list' ? 'Gestionar templates para generación de documentos' : 'Posicioná los campos sobre el PDF'}</span>
            {tipoDocumentoNombre && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs whitespace-nowrap">
                📋 {tipoDocumentoNombre}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {viewMode === 'list' && templates.length > 0 && (
            <button
              onClick={handleNuevoTemplate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          )}
          {saved && (
            <div className="bg-green-500 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
              ✓ Guardado
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay templates creados</p>
              <button
                onClick={handleNuevoTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
                Crear primer template
              </button>
            </div>
          ) : (
            <div className="grid gap-4 max-w-3xl mx-auto">
              {templates.map(template => (
                <div
                  key={template.codigo}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{template.nombre}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{template.codigo}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-xs text-gray-400">
                      {template.campos.length} campos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditarTemplate(template)}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarTemplate(template.codigo)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <PdfTemplateEditor
            onSave={handleSave}
            initialConfig={templateEditar || undefined}
            camposDisponibles={campos}
          />
        </div>
      )}
    </div>
  );
}
