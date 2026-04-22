'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportSyllabusProps {
  subjectId: string;
  subjectName: string;
}

export default function ExportSyllabus({ subjectId, subjectName }: ExportSyllabusProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Mapeo de claves de políticas a nombres legibles
      const KEY_LABELS: Record<string, string> = {
        policy_attendance: 'Asistencia y Puntualidad',
        policy_tasks: 'Tareas y Actividades',
        policy_evaluation: 'Evaluación General',
        policy_ethics: 'Ética Académica',
        policy_delivery: 'Entrega de Trabajos',
      };

      // 1. Cargar datos desde Supabase
      const [subjectResult, profileResult, policiesResult, unitsResult] = await Promise.all([
        supabase
          .from('subjects')
          .select('*, semesters(name)')
          .eq('id', subjectId)
          .single(),
        supabase
          .from('profile')
          .select('*')
          .limit(1)
          .single(),
        supabase
          .from('settings')
          .select('*')
          .order('key', { ascending: true }),
        supabase
          .from('units')
          .select('*, weeks(id, number, title, description)')
          .eq('subject_id', subjectId)
          .order('order', { ascending: true })
      ]);

      const subject = subjectResult.data;
      const profile = profileResult.data;
      const policies = policiesResult.data || [];
      const units = unitsResult.data || [];

      if (!subject) {
        alert('No se pudo cargar la asignatura');
        return;
      }

      // 2. Generar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header: logo textual y nombre de institución
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GESTOR ACADÉMICO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      if (profile?.institution_name) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.institution_name, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
      } else {
        yPosition += 5;
      }

      // Título
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SÍLABO DE ASIGNATURA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Datos informativos
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS INFORMATIVOS', 14, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const infoItems = [
        ['Asignatura:', subject.name || subjectName],
        ['Semestre:', (subject.semesters as any)?.name || 'N/A'],
        ['Docente:', profile?.name ?? 'No especificado'],
        ['Título:', profile?.title || 'N/A']
      ];

      infoItems.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 50, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Descripción de la asignatura
      if (subject.description) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPCIÓN DE LA ASIGNATURA', 14, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(subject.description, pageWidth - 28);
        doc.text(descLines, 14, yPosition);
        yPosition += (descLines.length * 5) + 8;
      }

      // Consideraciones generales (políticas)
      if (policies.length > 0) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CONSIDERACIONES GENERALES', 14, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        policies.forEach((policy: any) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(KEY_LABELS[policy.key] ?? policy.key, 14, yPosition);
          yPosition += 5;

          if (policy.content) {
            doc.setFont('helvetica', 'normal');
            const contentLines = doc.splitTextToSize(policy.content, pageWidth - 28);
            doc.text(contentLines, 14, yPosition);
            yPosition += (contentLines.length * 5) + 5;
          }
        });

        yPosition += 5;
      }

      // Plan curricular (tabla)
      if (units.length > 0) {
        // Check if we need a new page
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PLAN CURRICULAR', 14, yPosition);
        yPosition += 7;

        // Preparar datos para la tabla
        const tableData: any[] = [];
        units.forEach((unit: any) => {
          const weeks = unit.weeks || [];
          // Ordenar semanas por number
          const sortedWeeks = weeks.sort((a: any, b: any) => a.number - b.number);

          sortedWeeks.forEach((week: any) => {
            tableData.push([
              unit.name || `Unidad ${unit.order}`,
              `Semana ${week.number}`,
              week.title || '',
              week.description || ''
            ]);
          });

          // Si la unidad no tiene semanas, mostrar solo la unidad
          if (sortedWeeks.length === 0) {
            tableData.push([
              unit.name || `Unidad ${unit.order}`,
              '-',
              '-',
              '-'
            ]);
          }
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Unidad', 'Semana', 'Título', 'Temas']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [66, 66, 66],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 45 },
            3: { cellWidth: 'auto' }
          }
        });

        // Actualizar yPosition después de la tabla
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Footer: fecha de generación
      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Ir a la última página para el footer
      const pageCount = doc.getNumberOfPages();
      doc.setPage(pageCount);
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${currentDate}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // 3. Descargar PDF
      const fileName = `silabo-${subjectName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
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
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? 'Generando...' : '📄 Exportar Sílabo'}
    </button>
  );
}
