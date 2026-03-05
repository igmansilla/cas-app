/**
 * PdfTemplateEditor Component
 * 
 * Editor visual para posicionar campos sobre un template PDF.
 * Permite subir un PDF, renderizarlo, y hacer click para definir coordenadas de campos.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Save, Trash2, Type, Check, X, User, Crosshair, FileText, Menu } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from '../ui/drawer';
import { Button } from '../ui/button';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configurar worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface CampoTemplate {
  codigo: string;
  nombre: string;
  x: number;
  y: number;
  fontSize: number;
  tipo: 'texto' | 'checkbox' | 'fecha' | 'marker' | 'fijo';
  valorFijo?: string; // Para campos con valor predefinido
}

export interface TemplateConfig {
  codigo: string;
  nombre: string;
  pdfBase64: string;
  pageWidth: number;
  pageHeight: number;
  campos: CampoTemplate[];
}

interface PdfTemplateEditorProps {
  onSave: (config: TemplateConfig) => void;
  initialConfig?: TemplateConfig;
  camposDisponibles: Array<{ codigo: string; nombre: string; tipo: 'texto' | 'checkbox' | 'fecha' | 'marker' | 'fijo'; categoria: 'SISTEMA' | 'MARCADOR' | 'FIJO' | 'FORMULARIO' }>;
}

export function PdfTemplateEditor({ onSave, initialConfig, camposDisponibles }: PdfTemplateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>(initialConfig?.pdfBase64 || '');
  const [pageInfo, setPageInfo] = useState({ width: 0, height: 0 });
  const [campos, setCampos] = useState<CampoTemplate[]>(initialConfig?.campos || []);
  const [campoSeleccionado, setCampoSeleccionado] = useState<string | null>(null);
  const [nombreTemplate, setNombreTemplate] = useState(initialConfig?.nombre || '');
  const [codigoTemplate, setCodigoTemplate] = useState(initialConfig?.codigo || '');
  const [scale, setScale] = useState(1);
  const [textoFijo, setTextoFijo] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cargar PDF cuando cambia pdfBase64
  useEffect(() => {
    if (!pdfBase64) return;

    const loadPdf = async () => {
      try {
        const pdfData = atob(pdfBase64.split(',')[1] || pdfBase64);
        const pdfArray = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          pdfArray[i] = pdfData.charCodeAt(i);
        }
        
        const doc = await pdfjsLib.getDocument({ data: pdfArray }).promise;
        setPdfDoc(doc);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [pdfBase64]);

  // Renderizar página del PDF
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageInfo({ width: viewport.width / scale, height: viewport.height / scale });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (page.render as any)({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Dibujar campos posicionados
      drawCampos(context);
    };

    renderPage();
  }, [pdfDoc, scale, campos]);

  const drawCampos = (context: CanvasRenderingContext2D) => {
    campos.forEach(campo => {
      const x = campo.x * scale;
      const y = (pageInfo.height - campo.y) * scale; // PDF coords are from bottom
      
      // Dibujar marcador
      context.fillStyle = campo.codigo === campoSeleccionado ? '#f97316' : '#3b82f6';
      context.fillRect(x - 2, y - 2, 4, 4);
      
      // Dibujar nombre del campo
      context.font = '10px Arial';
      context.fillStyle = '#000';
      context.fillText(campo.nombre.substring(0, 15), x + 5, y + 3);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!campoSeleccionado || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = pageInfo.height - (e.clientY - rect.top) / scale; // Convert to PDF coords

    const campoInfo = camposDisponibles.find(c => c.codigo === campoSeleccionado);
    if (!campoInfo) return;

    setCampos(prev => {
      // Actualizar si ya existe, o agregar nuevo
      const existing = prev.find(c => c.codigo === campoSeleccionado);
      if (existing) {
        return prev.map(c => c.codigo === campoSeleccionado ? { ...c, x, y } : c);
      }
      
      // Capturar textoFijo antes de limpiar
      const valorParaGuardar = campoInfo.tipo === 'fijo' ? textoFijo : undefined;
      
      return [...prev, {
        codigo: campoInfo.tipo === 'fijo' ? `fijo_${Date.now()}` : campoSeleccionado,
        nombre: campoInfo.tipo === 'fijo' ? (textoFijo || 'Texto') : campoInfo.nombre,
        x,
        y,
        fontSize: 10,
        tipo: campoInfo.tipo,
        valorFijo: valorParaGuardar
      }];
    });
    
    // Limpiar texto fijo y deseleccionar después de agregar
    if (campoInfo.tipo === 'fijo') {
      setTextoFijo('');
      setCampoSeleccionado(null);
    }
  }, [campoSeleccionado, scale, pageInfo.height, camposDisponibles, textoFijo]);

  const handleRemoveCampo = (codigo: string) => {
    setCampos(prev => prev.filter(c => c.codigo !== codigo));
  };

  const handleSave = () => {
    if (!codigoTemplate || !nombreTemplate || !pdfBase64) {
      alert('Complete todos los campos requeridos');
      return;
    }

    onSave({
      codigo: codigoTemplate,
      nombre: nombreTemplate,
      pdfBase64,
      pageWidth: pageInfo.width,
      pageHeight: pageInfo.height,
      campos
    });
  };

  const CamposAccordion = () => (
    <div className="flex flex-col gap-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="sistema">
          <AccordionTrigger className="py-2 text-sm text-blue-700">
            <div className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4" />
              <span>Datos del Sistema</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-1 pb-2">
              {camposDisponibles.filter(c => c.categoria === 'SISTEMA').map(campo => {
                const posicionado = campos.find(c => c.codigo === campo.codigo);
                return (
                  <div
                    key={campo.codigo}
                    onClick={() => {
                      setCampoSeleccionado(campo.codigo);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${
                      campoSeleccionado === campo.codigo
                        ? 'bg-blue-100 border border-blue-300'
                        : posicionado
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-3 h-3 text-gray-400" />
                      <span>{campo.nombre}</span>
                    </div>
                    {posicionado && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCampo(campo.codigo); }}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="marcadores">
          <AccordionTrigger className="py-2 text-sm text-purple-700">
            <div className="flex items-center gap-2 font-medium">
              <Crosshair className="w-4 h-4" />
              <span>Marcadores</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-1 pb-2">
              {camposDisponibles.filter(c => c.categoria === 'MARCADOR').map(campo => {
                const posicionado = campos.find(c => c.codigo === campo.codigo);
                const isCheck = campo.codigo === 'marker_check';
                return (
                  <div
                    key={campo.codigo}
                    onClick={() => {
                      setCampoSeleccionado(campo.codigo);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${
                      campoSeleccionado === campo.codigo
                        ? 'bg-purple-100 border border-purple-300'
                        : posicionado
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCheck ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <X className="w-3 h-3 text-red-600" />
                      )}
                      <span>{campo.nombre}</span>
                    </div>
                    {posicionado && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCampo(campo.codigo); }}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fijo">
          <AccordionTrigger className="py-2 text-sm text-orange-700">
            <div className="flex items-center gap-2 font-medium">
              <Type className="w-4 h-4" />
              <span>Texto Fijo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-1 pb-2">
              <input
                type="text"
                value={textoFijo}
                onChange={(e) => setTextoFijo(e.target.value)}
                placeholder="Escribí un texto..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {camposDisponibles.filter(c => c.categoria === 'FIJO').map(campo => (
                <div
                  key={campo.codigo}
                  onClick={() => {
                    if (textoFijo) {
                      setCampoSeleccionado(campo.codigo);
                      setIsDrawerOpen(false);
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    campoSeleccionado === campo.codigo && textoFijo
                      ? 'bg-orange-100 border border-orange-300 cursor-pointer'
                      : textoFijo
                        ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-3 h-3" />
                    <span>{textoFijo || 'Ingrese texto primero'}</span>
                  </div>
                </div>
              ))}
              {/* Mostrar textos fijos agregados */}
              {campos.filter(c => c.tipo === 'fijo').length > 0 && (
                <div className="mt-2 space-y-1">
                  {campos.filter(c => c.tipo === 'fijo').map(c => (
                    <div key={c.codigo} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <span className="truncate">{c.valorFijo || c.nombre || '(sin texto)'}</span>
                      <button
                        onClick={() => handleRemoveCampo(c.codigo)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {camposDisponibles.filter(c => c.categoria === 'FORMULARIO').length > 0 && (
          <AccordionItem value="formulario">
            <AccordionTrigger className="py-2 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="w-4 h-4" />
                <span>Campos del Formulario</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pt-1 pb-2">
                {camposDisponibles.filter(c => c.categoria === 'FORMULARIO').map(campo => {
                  const posicionado = campos.find(c => c.codigo === campo.codigo);
                  return (
                    <div
                      key={campo.codigo}
                      onClick={() => {
                        setCampoSeleccionado(campo.codigo);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${
                        campoSeleccionado === campo.codigo
                          ? 'bg-emerald-100 border border-emerald-300'
                          : posicionado
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-3 h-3 text-emerald-500" />
                        <span className="truncate">{campo.nombre.replace('[Formulario] ', '')}</span>
                      </div>
                      {posicionado && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveCampo(campo.codigo); }}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Campos posicionados overview */}
      {campos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-xs text-gray-500 mb-2 uppercase tracking-wider">Posiciones Actuales</h4>
          <div className="text-xs space-y-1.5 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            {campos.map(c => (
              <div key={c.codigo} className="flex justify-between items-center group">
                <span className="truncate pr-2">{c.nombre}</span>
                <span className="text-gray-400 tabular-nums shrink-0">({Math.round(c.x)}, {Math.round(c.y)})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <input
            type="text"
            placeholder="Código (ej: AUTORIZACION)"
            value={codigoTemplate}
            onChange={e => setCodigoTemplate(e.target.value.toUpperCase().replace(/\s/g, '_'))}
            className="px-3 py-2 border rounded-lg text-sm w-full sm:w-64"
          />
          <input
            type="text"
            placeholder="Nombre del template"
            value={nombreTemplate}
            onChange={e => setNombreTemplate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm flex-1 w-full"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Subir PDF</span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Mobile floating button - only visible on small screens */}
        <div className="md:hidden absolute bottom-4 left-4 z-10">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Campos disponibles</DrawerTitle>
                <p className="text-xs text-muted-foreground">Seleccioná un campo y tocá el PDF para posicionarlo</p>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto">
                <CamposAccordion />
              </div>
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button variant="outline">Cerrar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Campos disponibles</h3>
          <p className="text-xs text-gray-500 mb-3">Seleccioná un campo y hacé click en el PDF para posicionarlo</p>
          <CamposAccordion />
        </div>

        {/* Canvas - PDF Preview */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-gray-200">
          {!pdfBase64 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Subí un PDF template para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="inline-block shadow-lg">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`bg-white ${campoSeleccionado ? 'cursor-crosshair' : 'cursor-default'}`}
              />
            </div>
          )}
        </div>

        {/* Zoom controls */}
        {pdfBase64 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow p-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="px-2 py-1 hover:bg-gray-100 rounded">-</button>
            <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.25))} className="px-2 py-1 hover:bg-gray-100 rounded">+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfTemplateEditor;
