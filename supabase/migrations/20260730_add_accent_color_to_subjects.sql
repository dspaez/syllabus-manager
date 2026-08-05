-- Color de acento "protagonista" (portada/tags del class kit, Fase 2 Parte 2).
-- Los colores funcionales por tipo de slide (rojo=problema, ámbar=alerta, etc.) están
-- fijos en el renderer y no dependen de esta columna.
alter table subjects add column accent_color text;
