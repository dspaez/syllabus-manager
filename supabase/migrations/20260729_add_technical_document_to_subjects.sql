-- FASE 1: documento técnico evolutivo por materia
alter table subjects add column technical_document text;
alter table subjects add column technical_document_updated_at timestamptz;
