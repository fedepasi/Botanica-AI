-- ===========================================
-- TASK #23: Sistema Cronologia e Note per Pianta (Diario)
-- ===========================================
-- 
-- Schema DB per il sistema diario di Botanica-AI
-- Features:
-- - Timestamp personalizzabile (inserisco oggi con data di 2 giorni fa)
-- - Persistenti finché non eliminate
-- - Raggruppate in sezione dedicata
-- - Supporto categorie e tags

-- ===========================================
-- Table: botanica_plant_notes (Diario)
-- ===========================================

DROP TABLE IF EXISTS botanica_plant_notes CASCADE;

CREATE TABLE botanica_plant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relazioni
  plant_id UUID NOT NULL REFERENCES botanica_plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenuto
  content TEXT NOT NULL,
  title TEXT, -- Titolo opzionale (es. "Piantato il nashi")
  
  -- Categorizzazione
  category TEXT DEFAULT 'general', -- general, planting, pruning, fertilizing, pest, observation, harvest, other
  tags TEXT[], -- Array di tag (es. ['formazione', 'urgente'])
  
  -- Timestamp personalizzabile (il cuore della feature)
  -- L'utente può specificare una data nel passato
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME WITHOUT TIME ZONE, -- Opzionale
  
  -- Metadati temporali
  created_at TIMESTAMPTZ DEFAULT now(), -- Quando è stato creato il record
  updated_at TIMESTAMPTZ DEFAULT now(), -- Ultima modifica
  
  -- Flag
  is_pinned BOOLEAN DEFAULT false, -- Note importanti in cima
  is_archived BOOLEAN DEFAULT false, -- Soft delete
  
  -- Weather context (opzionale, per arricchire la cronologia)
  weather_context JSONB, -- { temperature: 18, condition: "Sunny", note: "Giornata ideale" }
  
  -- Media attachments (future proof)
  attachments JSONB DEFAULT '[]' -- [{ type: 'image', url: '...', caption: '...' }]
);

-- ===========================================
-- Indexes per performance
-- ===========================================

-- Ricerca per pianta e data (uso principale: visualizzazione diario)
CREATE INDEX idx_notes_plant_date 
  ON botanica_plant_notes(plant_id, entry_date DESC);

-- Ricerca per utente (per statistiche/admin)
CREATE INDEX idx_notes_user 
  ON botanica_plant_notes(user_id);

-- Ricerca per categoria (filtri diario)
CREATE INDEX idx_notes_category 
  ON botanica_plant_notes(category);

-- Ricerca full-text su contenuto
CREATE INDEX idx_notes_content_search 
  ON botanica_plant_notes USING gin(to_tsvector('italian', content));

-- Note pinned in cima
CREATE INDEX idx_notes_pinned 
  ON botanica_plant_notes(plant_id, is_pinned DESC, entry_date DESC);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

ALTER TABLE botanica_plant_notes ENABLE ROW LEVEL SECURITY;

-- Utenti possono vedere solo le proprie note
CREATE POLICY "Users can view own plant notes"
  ON botanica_plant_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Utenti possono creare note solo per le proprie piante
CREATE POLICY "Users can insert own plant notes"
  ON botanica_plant_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Utenti possono modificare solo le proprie note
CREATE POLICY "Users can update own plant notes"
  ON botanica_plant_notes FOR UPDATE
  USING (auth.uid() = user_id);

-- Utenti possono eliminare solo le proprie note
CREATE POLICY "Users can delete own plant notes"
  ON botanica_plant_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- Trigger per updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_plant_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_plant_notes_updated_at
  BEFORE UPDATE ON botanica_plant_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_plant_notes_updated_at();

-- ===========================================
-- Views utili
-- ===========================================

-- Vista: Diario completo di una pianta con info arricchite
CREATE OR REPLACE VIEW plant_diary AS
SELECT 
  n.*,
  p.name as plant_name,
  p.image_url as plant_image,
  CASE 
    WHEN n.entry_date = CURRENT_DATE THEN 'today'
    WHEN n.entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
    WHEN n.entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END as time_group
FROM botanica_plant_notes n
JOIN botanica_plants p ON n.plant_id = p.id
WHERE n.is_archived = false
ORDER BY n.entry_date DESC, n.created_at DESC;

-- Vista: Timeline mensile (per riepiloghi)
CREATE OR REPLACE VIEW plant_notes_monthly_summary AS
SELECT 
  plant_id,
  user_id,
  DATE_TRUNC('month', entry_date) as month,
  COUNT(*) as note_count,
  array_agg(DISTINCT category) as categories
FROM botanica_plant_notes
WHERE is_archived = false
GROUP BY plant_id, user_id, DATE_TRUNC('month', entry_date)
ORDER BY month DESC;

-- ===========================================
-- Enum e constraint per category
-- ===========================================

-- Valori validi per category (documentazione, non enforced dal DB)
-- 'general' - Note generiche
-- 'planting' - Piantumazione
-- 'pruning' - Potatura
-- 'fertilizing' - Concimazione
-- 'pest' - Parassiti/trattamenti
-- 'observation' - Osservazioni
-- 'harvest' - Raccolta
-- 'transplant' - Trapianto
-- 'other' - Altro

-- ===========================================
-- Funzioni helper
-- ===========================================

-- Funzione: Aggiungi nota con data personalizzata
CREATE OR REPLACE FUNCTION add_plant_note(
  p_plant_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_title TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_entry_date DATE DEFAULT CURRENT_DATE,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_note_id UUID;
BEGIN
  INSERT INTO botanica_plant_notes (
    plant_id, user_id, content, title, category, entry_date, tags
  ) VALUES (
    p_plant_id, p_user_id, p_content, p_title, p_category, p_entry_date, p_tags
  )
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Recupera diario di una pianta
CREATE OR REPLACE FUNCTION get_plant_diary(p_plant_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  content TEXT,
  title TEXT,
  category TEXT,
  entry_date DATE,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.content, n.title, n.category, n.entry_date, n.is_pinned, n.created_at
  FROM botanica_plant_notes n
  WHERE n.plant_id = p_plant_id AND n.is_archived = false
  ORDER BY n.is_pinned DESC, n.entry_date DESC, n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Dati di esempio (per testing)
-- ===========================================

/*
-- Esempio: Piantato il nashi a ottobre
SELECT add_plant_note(
  'uuid-pianta-nashi',
  'uuid-utente',
  'Piantato il nashi nel frutteto sud. Terra ben drenata, esposizione sud-est.',
  'Piantumazione nashi',
  'planting',
  '2025-10-15',
  ARRAY['frutteto-sud', 'nuova-pianta']
);

-- Esempio: Ha bisogno di formazione
SELECT add_plant_note(
  'uuid-pianta-pero',
  'uuid-utente',
  'Ha bisogno di formazione perché è un alberello libertino. I rami crescono disordinati.',
  'Formazione pero',
  'pruning',
  '2026-02-11',
  ARRAY['urgente', 'formazione']
);

-- Esempio: Nota con data nel passato (2 giorni fa)
SELECT add_plant_note(
  'uuid-pianta-melo',
  'uuid-utente',
  'Concimazione primaverile effettuata con compost maturo.',
  'Concimazione',
  'fertilizing',
  CURRENT_DATE - INTERVAL '2 days',
  ARRAY['concimazione', 'primavera']
);
*/

-- ===========================================
-- Commenti per documentazione
-- ===========================================

COMMENT ON TABLE botanica_plant_notes IS 'Diario/cronologia delle note per ogni pianta. Supporta timestamp personalizzati.';
COMMENT ON COLUMN botanica_plant_notes.entry_date IS 'Data personalizzabile della nota (può essere nel passato)';
COMMENT ON COLUMN botanica_plant_notes.category IS 'Categoria della nota: general, planting, pruning, fertilizing, pest, observation, harvest, transplant, other';
COMMENT ON COLUMN botanica_plant_notes.is_archived IS 'Soft delete - la nota non viene eliminata ma nascosta';
