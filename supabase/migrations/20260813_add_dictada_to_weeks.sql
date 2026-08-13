-- Marca explícita de "esta clase ya se dio", puesta a mano por el docente — nunca inferida de si
-- hay materiales generados. Antes se usaba "tiene materiales" como aproximación de "se dictó",
-- pero eso confunde dos cosas distintas: generar contenido (que puede pasar antes o después de
-- dar la clase) y haberla dado de verdad. Con "Sugerir próxima semana" permitiendo planificar
-- varias semanas de título por adelantado (sin generar contenido todavía), hace falta esta señal
-- separada para que el contexto que se le pasa a la IA distinga "ya dictada" de "planificada".
alter table weeks add column dictada boolean not null default false;
