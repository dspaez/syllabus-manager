'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportSyllabusProps {
  subjectId: string;
  subjectName: string;
}

const KEY_LABELS: Record<string, string> = {
  policy_attendance: 'Asistencia y Puntualidad',
  policy_tasks: 'Tareas y Actividades',
  policy_evaluation: 'Evaluación General',
  policy_ethics: 'Ética Académica',
  policy_delivery: 'Entrega de Trabajos',
};

// Convert hex color to RGB array for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [30, 64, 175];
  return [r, g, b];
}

// Lighten RGB color by mixing with white
function lightenRgb(rgb: [number, number, number], factor: number): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * factor),
    Math.round(rgb[1] + (255 - rgb[1]) * factor),
    Math.round(rgb[2] + (255 - rgb[2]) * factor),
  ];
}

// Add header and footer to every page except cover
function addPageDecorations(
  doc: jsPDF,
  subjectName: string,
  institutionName: string,
  accentRgb: [number, number, number],
  currentPage: number,
  totalPages: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top accent bar
  doc.setFillColor(...accentRgb);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Header text
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(institutionName || 'AulaVirtual', 14, 9);
  doc.text(subjectName, pageWidth / 2, 9, { align: 'center' });
  doc.text(`Pág. ${currentPage} / ${totalPages}`, pageWidth - 14, 9, { align: 'right' });

  // Separator line under header
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(14, 12, pageWidth - 14, 12);

  // Footer line
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  // Footer text
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generado el ${date}`, 14, pageHeight - 7);
  doc.text('Sílabo de Asignatura', pageWidth - 14, pageHeight - 7, { align: 'right' });
}

export default function ExportSyllabus({ subjectId, subjectName }: ExportSyllabusProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const [subjectResult, profileResult, policiesResult, unitsResult] = await Promise.all([
        supabase.from('subjects').select('*, semesters(name)').eq('id', subjectId).single(),
        supabase.from('profile').select('*').limit(1).single(),
        supabase.from('settings').select('*').order('key', { ascending: true }),
        supabase
          .from('units')
          .select('*, weeks(id, number, title, description)')
          .eq('subject_id', subjectId)
          .order('order', { ascending: true }),
      ]);

      const subject = subjectResult.data;
      const profile = profileResult.data;
      const policies = policiesResult.data || [];
      const units = unitsResult.data || [];

      if (!subject) {
        alert('No se pudo cargar la asignatura');
        return;
      }

      const accentHex: string = (subject.color as string | null) ?? '#1e40af';
      const accentRgb = hexToRgb(accentHex);
      const accentLight = lightenRgb(accentRgb, 0.88);
      const institutionName: string = (profile?.institution_name as string | null) ?? 'AulaVirtual';
      const semesterName: string = (subject.semesters as { name?: string } | null)?.name ?? 'N/A';

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ── COVER PAGE ──────────────────────────────────────────────────────

      // Background: full accent color top half
      doc.setFillColor(...accentRgb);
      doc.rect(0, 0, pageWidth, pageHeight * 0.55, 'F');

      // Background: light bottom half
      doc.setFillColor(...accentLight);
      doc.rect(0, pageHeight * 0.55, pageWidth, pageHeight * 0.45, 'F');

      // Decorative circles
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as unknown as { GState: new (arg: { opacity: number }) => object }).GState({ opacity: 0.05 }));
      doc.circle(pageWidth - 20, 20, 60, 'F');
      doc.circle(10, pageHeight * 0.5, 40, 'F');
      doc.setGState(new (doc as unknown as { GState: new (arg: { opacity: number }) => object }).GState({ opacity: 1 }));

      // Institution name (top)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text((institutionName).toUpperCase(), pageWidth / 2, 28, { align: 'center' });

      // Divider line
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      const lineW = 40;
      doc.line(pageWidth / 2 - lineW, 33, pageWidth / 2 + lineW, 33);

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      const opacity80: [number, number, number] = [255, 255, 255];
      doc.setTextColor(...opacity80);
      doc.text('SÍLABO DE ASIGNATURA', pageWidth / 2, 40, { align: 'center' });

      // Subject name (large)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(255, 255, 255);
      const nameLines = doc.splitTextToSize(subject.name as string || subjectName, pageWidth - 40);
      doc.text(nameLines, pageWidth / 2, 65, { align: 'center' });

      // White card for info
      const cardTop = pageHeight * 0.55 + 10;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, cardTop, pageWidth - 40, 60, 4, 4, 'F');

      // Info fields inside card
      const infoItems: [string, string][] = [
        ['Semestre', semesterName],
        ['Docente', (profile?.name as string | null) ?? 'No especificado'],
        ['Título', (profile?.title as string | null) ?? '—'],
      ];

      doc.setFontSize(9);
      let infoY = cardTop + 14;
      infoItems.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentRgb);
        doc.text(label, 32, infoY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(value, 75, infoY);
        doc.setDrawColor(235, 235, 235);
        doc.setLineWidth(0.2);
        doc.line(32, infoY + 3, pageWidth - 32, infoY + 3);
        infoY += 14;
      });

      // Description below card
      if (subject.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        const descLines = doc.splitTextToSize(subject.description as string, pageWidth - 40);
        doc.text(descLines, pageWidth / 2, cardTop + 72, { align: 'center' });
      }

      // ── CONTENT PAGES ───────────────────────────────────────────────────

      // Count total pages (cover + policies page if any + curriculum)
      // We'll add decorations after building all pages using doc.getNumberOfPages()

      // Page 2: Policies
      if (policies.length > 0) {
        doc.addPage();
        let y = 22;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...accentRgb);
        doc.text('CONSIDERACIONES GENERALES', 14, y);
        y += 3;

        doc.setDrawColor(...accentRgb);
        doc.setLineWidth(0.6);
        doc.line(14, y + 1, 90, y + 1);
        y += 8;

        policies.forEach((policy: Record<string, string>) => {
          if (y > pageHeight - 30) {
            doc.addPage();
            y = 22;
          }

          const label = KEY_LABELS[policy.key] ?? policy.key;
          const value: string = (policy.value as string | null) ?? (policy.content as string | null) ?? '';

          // Policy label pill
          doc.setFillColor(...accentLight);
          doc.roundedRect(14, y - 4, pageWidth - 28, 8, 2, 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...accentRgb);
          doc.text(label.toUpperCase(), 18, y + 0.5);
          y += 8;

          if (value) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(value, pageWidth - 32);
            doc.text(lines, 18, y);
            y += lines.length * 4.5 + 8;
          } else {
            y += 8;
          }
        });
      }

      // Page: Curriculum plan
      if (units.length > 0) {
        doc.addPage();
        let y = 22;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...accentRgb);
        doc.text('PLAN CURRICULAR', 14, y);
        y += 3;

        doc.setDrawColor(...accentRgb);
        doc.setLineWidth(0.6);
        doc.line(14, y + 1, 70, y + 1);
        y += 10;

        (units as Array<{ name?: string; order?: number; weeks?: Array<{ number?: number; title?: string; description?: string }> }>)
          .forEach((unit, uIdx) => {
            const unitName: string = unit.name ?? `Unidad ${unit.order ?? uIdx + 1}`;
            const weeks = [...(unit.weeks ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

            if (y > pageHeight - 40) {
              doc.addPage();
              y = 22;
            }

            const tableData = weeks.map((week) => [
              `S${week.number ?? '?'}`,
              week.title ?? '—',
              week.description ?? '—',
            ]);

            if (tableData.length === 0) {
              tableData.push(['—', 'Sin semanas', '—']);
            }

            autoTable(doc, {
              startY: y,
              head: [[
                { content: unitName, colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fontSize: 10 } },
              ]],
              body: tableData,
              theme: 'grid',
              headStyles: {
                fillColor: accentRgb,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
              },
              columnStyles: {
                0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: accentRgb as [number, number, number] },
                1: { cellWidth: 55 },
                2: { cellWidth: 'auto' },
              },
              bodyStyles: {
                fontSize: 8.5,
                textColor: [50, 50, 50],
                cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
              },
              alternateRowStyles: {
                fillColor: accentLight,
              },
              styles: {
                lineColor: [220, 220, 220],
                lineWidth: 0.2,
              },
              margin: { left: 14, right: 14 },
            });

            y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
          });
      }

      // ── Apply header/footer to all pages except cover ──
      const totalPages = doc.getNumberOfPages();
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        addPageDecorations(doc, subject.name as string || subjectName, institutionName, accentRgb, p - 1, totalPages - 1);
      }

      // Save
      const fileName = `silabo-${(subject.name as string || subjectName).toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el sílabo. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm4 3.5a.75.75 0 0 1 .75.75v2.69l.72-.72a.75.75 0 1 1 1.06 1.06l-2 2a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06l.72.72V6.25A.75.75 0 0 1 8 5.5Z" clipRule="evenodd" />
          </svg>
          Exportar Sílabo
        </>
      )}
    </button>
  );
}
