-- A qué semana corresponde el estado actual de subjects.technical_document — dato explícito,
-- no inferido (inferirlo por "semana con número más alto que tiene snapshot" se rompe si se
-- regenera una semana anterior fuera de orden, algo real en cómo se usa esta app). Se guarda el
-- id de la semana (no solo el número) porque el número de semana no es necesariamente único
-- dentro de una materia (confirmado: hay materias reales con numeración repetida entre
-- unidades) — con el id se puede resolver número Y unidad sin ambigüedad.
alter table subjects add column technical_document_week_id uuid;
