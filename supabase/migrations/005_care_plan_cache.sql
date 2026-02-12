-- ===========================================
-- TASK #24: Cache Piano di Cura + Rigenerazione Smart
-- ===========================================
-- 
-- Schema DB per il caching del piano di cura delle piante
-- Features:
-- - Campo JSONB cached_care_plan per salvare il piano strutturato
-- - Timestamp care_plan_generated_at per tracciare età cache
-- - Invalidazione cache su: note aggiunta, modifica pianta, rigenera manuale

-- ===========================================
-- Migration: Aggiungi campi cache a botanica_plants
-- ===========================================

-- Aggiungi colonna JSONB per il piano di cura in cache
ALTER TABLE botanica_plants 
ADD COLUMN IF NOT EXISTS cached_care_plan JSONB;

-- Aggiungi timestamp per tracciare quando è stato generato il piano
ALTER TABLE botanica_plants 
ADD COLUMN IF NOT EXISTS care_plan_generated_at TIMESTAMPTZ;

-- Aggiungi flag per forzare rigenerazione (usato dal bottone "Rigenera")
ALTER TABLE botanica_plants 
ADD COLUMN IF NOT EXISTS care_plan_needs_regeneration BOOLEAN DEFAULT false;

-- ===========================================
-- Index per performance
-- ===========================================

-- Index per verificare rapidamente se una pianta ha il piano in cache
CREATE INDEX IF NOT EXISTS idx_plants_cached_care_plan 
  ON botanica_plants(id, care_plan_generated_at) 
  WHERE cached_care_plan IS NOT NULL;

-- Index per trovare piani da rigenerare (cron job)
CREATE INDEX IF NOT EXISTS idx_plants_care_plan_regeneration 
  ON botanica_plants(care_plan_needs_regeneration) 
  WHERE care_plan_needs_regeneration = true;

-- ===========================================
-- Funzione: Verifica se il piano di cura è scaduto
-- ===========================================

CREATE OR REPLACE FUNCTION is_care_plan_expired(
  p_generated_at TIMESTAMPTZ,
  p_max_age_days INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se non c'è timestamp, il piano è considerato scaduto
  IF p_generated_at IS NULL THEN
    RETURN true;
  END IF;
  
  -- Verifica se sono passati più di X giorni
  RETURN p_generated_at < (NOW() - INTERVAL '1 day' * p_max_age_days);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===========================================
-- Funzione: Invalida cache piano di cura (trigger)
-- ===========================================

CREATE OR REPLACE FUNCTION invalidate_care_plan_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando la pianta viene modificata, invalida il piano di cura
  NEW.cached_care_plan = NULL;
  NEW.care_plan_generated_at = NULL;
  NEW.care_plan_needs_regeneration = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per invalidare cache quando la pianta viene modificata
DROP TRIGGER IF EXISTS trigger_invalidate_care_plan_cache ON botanica_plants;

CREATE TRIGGER trigger_invalidate_care_plan_cache
  BEFORE UPDATE OF name, description, care_needs, notes ON botanica_plants
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_care_plan_cache();

-- ===========================================
-- Funzione: Salva piano di cura in cache
-- ===========================================

CREATE OR REPLACE FUNCTION cache_care_plan(
  p_plant_id UUID,
  p_care_plan JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE botanica_plants
  SET 
    cached_care_plan = p_care_plan,
    care_plan_generated_at = NOW(),
    care_plan_needs_regeneration = false
  WHERE id = p_plant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Funzione: Richiedi rigenerazione manuale
-- ===========================================

CREATE OR REPLACE FUNCTION request_care_plan_regeneration(
  p_plant_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE botanica_plants
  SET 
    care_plan_needs_regeneration = true,
    cached_care_plan = NULL,
    care_plan_generated_at = NULL
  WHERE id = p_plant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Funzione: Trigger per note aggiunta
-- ===========================================

CREATE OR REPLACE FUNCTION invalidate_care_plan_on_note()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando viene aggiunta una nota, invalida il piano di cura della pianta
  UPDATE botanica_plants
  SET 
    care_plan_needs_regeneration = true,
    cached_care_plan = NULL,
    care_plan_generated_at = NULL
  WHERE id = NEW.plant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per invalidare cache quando viene aggiunta una nota
DROP TRIGGER IF EXISTS trigger_invalidate_care_plan_on_note ON botanica_plant_notes;

CREATE TRIGGER trigger_invalidate_care_plan_on_note
  AFTER INSERT ON botanica_plant_notes
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_care_plan_on_note();

-- ===========================================
-- Vista: Piante che necessitano rigenerazione
-- ===========================================

CREATE OR REPLACE VIEW plants_needing_care_plan_regeneration AS
SELECT 
  p.id,
  p.name,
  p.user_id,
  p.care_plan_generated_at,
  p.care_plan_needs_regeneration,
  CASE 
    WHEN p.care_plan_needs_regeneration THEN 'manual_request'
    WHEN p.care_plan_generated_at IS NULL THEN 'never_generated'
    WHEN is_care_plan_expired(p.care_plan_generated_at) THEN 'expired'
    ELSE 'up_to_date'
  END as regeneration_reason
FROM botanica_plants p
WHERE 
  p.care_plan_needs_regeneration = true
  OR p.care_plan_generated_at IS NULL
  OR is_care_plan_expired(p.care_plan_generated_at);

-- ===========================================
-- Cron Job Helper (per edge function)
-- ===========================================

-- Funzione per ottenere piante con piano scaduto (usabile da cron job)
CREATE OR REPLACE FUNCTION get_plants_with_expired_care_plan(
  p_max_age_days INT DEFAULT 15,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  plant_id UUID,
  plant_name TEXT,
  user_id UUID,
  generated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as plant_id,
    p.name as plant_name,
    p.user_id,
    p.care_plan_generated_at as generated_at
  FROM botanica_plants p
  WHERE 
    p.cached_care_plan IS NULL
    OR is_care_plan_expired(p.care_plan_generated_at, p_max_age_days)
  ORDER BY p.care_plan_generated_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Commenti per documentazione
-- ===========================================

COMMENT ON COLUMN botanica_plants.cached_care_plan IS 'JSONB contenente il piano di cura strutturato (cache)';
COMMENT ON COLUMN botanica_plants.care_plan_generated_at IS 'Timestamp ultima generazione del piano di cura';
COMMENT ON COLUMN botanica_plants.care_plan_needs_regeneration IS 'Flag per richiedere rigenerazione manuale';

-- ===========================================
-- Esempio di utilizzo:
-- ===========================================

/*
-- Salvare un piano di cura in cache:
SELECT cache_care_plan(
  'uuid-della-pianta',
  '{"watering": {"frequency": "2-3 times per week"}, ...}'::jsonb
);

-- Richiedere rigenerazione manuale:
SELECT request_care_plan_regeneration('uuid-della-pianta');

-- Ottenere piante con piano scaduto (per cron job):
SELECT * FROM get_plants_with_expired_care_plan(15, 50);

-- Verificare stato cache di una pianta:
SELECT 
  name,
  care_plan_generated_at,
  is_care_plan_expired(care_plan_generated_at, 15) as is_expired
FROM botanica_plants 
WHERE id = 'uuid-della-pianta';
*/
