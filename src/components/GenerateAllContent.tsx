'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface GenerateAllContentProps {
  unitId: string;
  subjectId: string;
}

type Week = {
  id: string;
  number: number;
  title: string;
  description: string | null;
};

const CONTENT_TYPES = [
  { value: 'slides', label: 'Diapositivas' },
  { value: 'exercises', label: 'Ejercicios' },
  { value: 'guide', label: 'Guía de Estudio' },
];

export default function GenerateAllContent({ unitId, subjectId }: GenerateAllContentProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [contentType, setContentType] = useState<string>('slides');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleOpen = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('unit_id', unitId)
      .order('number', { ascending: true });

    if (error) {
      alert('Error al cargar las semanas');
      return;
    }

    if (!data || data.length === 0) {
      alert('No hay semanas en esta unidad');
      return;
    }

    setWeeks(data);
    // Marcar todas por defecto
    setSelectedWeeks(new Set(data.map((w) => w.id)));
    setIsOpen(true);
  };

  const toggleWeek = (weekId: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  const handleGenerateAll = async () => {
    if (selectedWeeks.size === 0) {
      alert('Selecciona al menos una semana');
      return;
    }

    setIsGenerating(true);
    const supabase = createClient();
    const selectedWeeksList = weeks.filter((w) => selectedWeeks.has(w.id));
    let successCount = 0;

    for (let i = 0; i < selectedWeeksList.length; i++) {
      const week = selectedWeeksList[i];
      setProgress(`Generando semana ${i + 1} de ${selectedWeeksList.length}...`);

      try {
        // Generar contenido con IA
        const topic = week.title + (week.description ? ': ' + week.description : '');
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: contentType, topic }),
        });

        if (!response.ok) {
          console.error(`Error generando contenido para semana ${week.number}`);
          continue;
        }

        const content = await response.json();

        // Determinar nombre y tipo del material
        let materialName = '';
        let materialType = '';

        if (contentType === 'slides') {
          materialName = `Presentación: ${week.title}`;
          materialType = 'pptx';
        } else if (contentType === 'exercises') {
          materialName = `Ejercicios: ${week.title}`;
          materialType = 'doc';
        } else if (contentType === 'guide') {
          materialName = `Guía: ${week.title}`;
          materialType = 'doc';
        }

        // Insertar en materials
        const { error: insertError } = await supabase.from('materials').insert({
          week_id: week.id,
          name: materialName,
          type: materialType,
          description: JSON.stringify(content),
          source: 'ai',
          is_published: false,
        });

        if (insertError) {
          console.error(`Error insertando material para semana ${week.number}:`, insertError);
        } else {
          successCount++;
        }

        // Esperar 3 segundos entre requests
        if (i < selectedWeeksList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`Error procesando semana ${week.number}:`, error);
      }
    }

    setProgress(`✓ ${successCount} materiales generados correctamente`);
    setIsGenerating(false);

    // Esperar 2 segundos antes de cerrar para mostrar el resumen
    setTimeout(() => {
      setIsOpen(false);
      setProgress('');
      router.refresh();
    }, 2000);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        ⚡ Generar contenido de toda la unidad
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Generar contenido para toda la unidad
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona las semanas y el tipo de contenido a generar
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {/* Tipo de contenido */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de contenido
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de semanas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Semanas ({selectedWeeks.size} seleccionadas)
                  </label>
                  <button
                    onClick={() => {
                      if (selectedWeeks.size === weeks.length) {
                        setSelectedWeeks(new Set());
                      } else {
                        setSelectedWeeks(new Set(weeks.map((w) => w.id)));
                      }
                    }}
                    disabled={isGenerating}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400"
                  >
                    {selectedWeeks.size === weeks.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {weeks.map((week) => (
                    <label
                      key={week.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWeeks.has(week.id)}
                        onChange={() => toggleWeek(week.id)}
                        disabled={isGenerating}
                        className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          Semana {week.number}: {week.title}
                        </p>
                        {week.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {week.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress */}
              {progress && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{progress}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:text-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isGenerating || selectedWeeks.size === 0}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generando...' : 'Generar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
