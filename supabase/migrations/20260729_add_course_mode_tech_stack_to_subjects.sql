-- Tipos de materia: proyecto progresivo vs. temas con ejercicios independientes.
-- Default 'topics' por seguridad: el doc. técnico queda oculto hasta marcar la materia como 'project'.
alter table subjects add column course_mode text
  check (course_mode in ('project', 'topics')) default 'topics';
alter table subjects add column tech_stack text;
