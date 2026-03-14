/**
 * FichaMedicaBulkPrint Component
 * 
 * Genera un PDF con todas las fichas médicas de usuarios para impresión masiva.
 */

import { useState } from 'react';
import { Printer, X, Loader2 } from 'lucide-react';
import type { DocumentoCompletado } from '../../api/schemas/documentos';

interface DocumentoConUsuario {
  documento: DocumentoCompletado;
  usuario: {
    id: number;
    keycloakId: string;
    nombreMostrar: string;
    dni?: string | null;
    fechaNacimiento?: string | null;
    direccion?: string | null;
    localidad?: string | null;
    telefono?: string | null;
    email: string;
  };
}

interface FichaMedicaBulkPrintProps {
  documentos: DocumentoConUsuario[];
  onClose: () => void;
}

export function FichaMedicaBulkPrint({ documentos, onClose }: FichaMedicaBulkPrintProps) {
  const [imprimiendo, setImprimiendo] = useState(false);

  const handlePrint = () => {
    setImprimiendo(true);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes para imprimir');
      setImprimiendo(false);
      return;
    }

    const content = documentos.map(({ documento, usuario }) => 
      generarFichaHtml(documento, usuario)
    ).join('<div class="page-break"></div>');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fichas Médicas - Impresión Masiva</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
            .ficha { padding: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            td, th { border: 1px solid #666; padding: 3px 6px; }
            .header-row { background-color: #eee; }
            h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
            h2 { font-size: 14px; text-align: center; margin-bottom: 6px; }
            h3 { font-size: 12px; text-align: center; margin: 8px 0; font-weight: bold; }
            .subtitle { font-size: 9px; text-align: center; margin-bottom: 12px; }
            .firmas { margin-top: 20px; display: flex; justify-content: space-between; text-align: center; font-size: 9px; }
            .firma-line { border-top: 1px solid #000; width: 130px; margin: 25px auto 0; padding-top: 3px; }
            .si-no { text-align: center; width: 50px; }
            .page-break { page-break-after: always; }
            @media print {
              .ficha { padding: 0; }
              @page { margin: 10mm; size: A4; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setImprimiendo(false);
  };

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-AR');
    } catch {
      return fecha;
    }
  };

  const generarFichaHtml = (documento: DocumentoCompletado, usuario: DocumentoConUsuario['usuario']) => {
    const r = documento.respuestas || {};
    
    const filasSiNo = (preguntas: Array<{ label: string; key: string }>) => 
      preguntas.map(p => `
        <tr>
          <td>${p.label}</td>
          <td class="si-no">SI: ${r[p.key] === 'Sí' ? '<strong>X</strong>' : ''}</td>
          <td class="si-no">NO: ${r[p.key] === 'No' ? '<strong>X</strong>' : ''}</td>
        </tr>
      `).join('');

    const contactos = [1, 2, 3]
      .filter(i => r[`contacto_${i}_nombre`])
      .map(i => `
        <tr>
          <td>${r[`contacto_${i}_nombre`] || ''}</td>
          <td>${r[`contacto_${i}_vinculo`] || ''}</td>
          <td>${r[`contacto_${i}_telefono`] || ''}</td>
          <td>${r[`contacto_${i}_celular`] || ''}</td>
          <td>${r[`contacto_${i}_dni`] || ''}</td>
        </tr>
      `).join('');

    return `
      <div class="ficha">
        <h1>Campamento Andino Sayhueque</h1>
        <h2>FICHA MÉDICA DEL TITULAR</h2>
        <p class="subtitle">Tildar lo que corresponda.</p>

        <table>
          <tr>
            <td><strong>Acampante:</strong> ${usuario.nombreMostrar}</td>
            <td><strong>Año:</strong> ${new Date().getFullYear()}</td>
          </tr>
          <tr>
            <td><strong>Grupo:</strong></td>
            <td><strong>Fecha nac:</strong> ${formatFecha(usuario.fechaNacimiento)}</td>
            <td><strong>DNI:</strong> ${usuario.dni || ''}</td>
          </tr>
          <tr>
            <td><strong>Domicilio:</strong> ${usuario.direccion || ''}</td>
            <td colspan="2"><strong>Localidad:</strong> ${usuario.localidad || ''}</td>
          </tr>
          <tr>
            <td><strong>Tel:</strong> ${usuario.telefono || ''}</td>
            <td colspan="2"><strong>Mail:</strong> ${usuario.email}</td>
          </tr>
          <tr>
            <td><strong>Grupo Sang:</strong> ${r.grupo_sanguineo || ''}</td>
            <td><strong>Factor RH:</strong> ${r.factor_rh || ''}</td>
            <td><strong>Peso:</strong> ${r.peso || ''} <strong>Alt:</strong> ${r.altura || ''}</td>
          </tr>
        </table>

        <table>
          <thead><tr class="header-row"><th colspan="3" style="text-align:left">Estado de Salud</th></tr></thead>
          <tbody>
            ${filasSiNo([
              { label: 'Procesos inflamatorios o infecciosos', key: 'procesos_inflamatorios' },
            ])}
            <tr class="header-row"><td colspan="3"><strong>Enfermedades:</strong></td></tr>
            ${filasSiNo([
              { label: 'Diabetes', key: 'diabetes' },
              { label: 'Hernias inguinales', key: 'hernias' },
              { label: 'Cardiopatías congénitas', key: 'cardiopatias_congenitas' },
              { label: 'Cardiopatías infecciosas', key: 'cardiopatias_infecciosas' },
              { label: 'Epilepsia', key: 'epilepsia' },
              { label: 'Arritmias', key: 'arritmias' },
              { label: 'Asma/respiratorias', key: 'asma' },
              { label: 'Hipertensión/hipotensión', key: 'hipertension' },
              { label: 'Alergias', key: 'alergias' },
              { label: 'Convulsiones', key: 'convulsiones' },
              { label: 'Pánico/fobias', key: 'panico_fobias' },
            ])}
            <tr class="header-row"><td colspan="3"><strong>Padecido recientemente:</strong></td></tr>
            ${filasSiNo([
              { label: 'Hepatitis (60 días)', key: 'hepatitis_reciente' },
              { label: 'Sarampión (30 días)', key: 'sarampion_reciente' },
              { label: 'Parotiditis (30 días)', key: 'parotiditis_reciente' },
              { label: 'Mononucleosis (30 días)', key: 'mononucleosis_reciente' },
            ])}
            <tr class="header-row"><td colspan="3"><strong>Vacunación y lesiones:</strong></td></tr>
            ${filasSiNo([
              { label: 'Vacunas completas', key: 'vacunas_completas' },
              { label: 'Esguinces/luxaciones', key: 'esguinces_luxaciones' },
              { label: 'Fracturas', key: 'fracturas' },
              { label: 'Dificultad motriz', key: 'dificultad_motriz' },
            ])}
          </tbody>
        </table>

        <h3>Contactos de Emergencia</h3>
        <table>
          <thead>
            <tr class="header-row">
              <th>Nombre</th><th>Vínculo</th><th>Tel</th><th>Celular</th><th>DNI</th>
            </tr>
          </thead>
          <tbody>
            ${contactos || '<tr><td colspan="5" style="text-align:center;font-style:italic">Sin contactos</td></tr>'}
          </tbody>
        </table>

        <div class="firmas">
          <div><div class="firma-line">Firma responsable parental</div><div class="firma-line">Aclaración y DNI</div></div>
          <div><div class="firma-line">Firma acampante menor</div><div class="firma-line">Aclaración y DNI</div></div>
          <div><div class="firma-line">Firma Representante CAS</div><div class="firma-line">Aclaración y DNI</div></div>
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Imprimir Fichas Médicas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Se van a imprimir <strong>{documentos.length}</strong> fichas médicas.
          </p>
          <p className="text-sm text-gray-500">
            Cada ficha aparecerá en una página separada. Podés guardar como PDF desde el diálogo de impresión.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            disabled={imprimiendo || documentos.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {imprimiendo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Imprimir todas
          </button>
        </div>
      </div>
    </div>
  );
}

export default FichaMedicaBulkPrint;
