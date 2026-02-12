# Botanica-AI: Deliverable Task P0 (#21, #22, #23)

**Data:** 2026-02-11  
**Agente:** botanica-caretaker  
**Progetto:** Botanica-AI

---

## 📦 Contenuto

Questo pacchetto contiene tutti i deliverable per i 3 task P0 di Botanica-AI.

---

## ✅ TASK #21: Piano di cura strutturato JSON

### Stato: COMPLETATO (in review)

### Modifiche

1. **Edge Function Gemini** (`gemini-edge-function.ts`)
   - Modificata action `generateDetailedCarePlan`
   - Nuovo schema JSON strutturato con Type.OBJECT
   - Retro-compatibilità con parametro `format=markdown`
   - Helper `generateMarkdownFromCarePlan()` per conversione

### Schema JSON Strutturato

```typescript
{
  watering: {
    frequency: string;      // "2-3 times per week"
    amount: string;         // "Deep soak until water drains"
    technique?: string;     // "Water at base, avoid foliage"
    seasonalNotes?: string; // "Reduce in winter"
  },
  sunlight: {
    requirement: string;    // "Full sun", "Partial shade"
    hoursPerDay?: string;   // "6-8 hours"
    placement?: string;     // "South-facing window"
  },
  soil: {
    type: string;           // "Well-draining loamy soil"
    ph?: string;            // "6.0-7.0"
    amendments?: string;    // "Add compost annually"
  },
  fertilizing?: {
    type: string;           // "Balanced NPK 10-10-10"
    frequency: string;      // "Monthly during growing season"
    timing?: string;        // "Spring to early fall"
  },
  pruning?: {
    timing?: string;        // "Late winter"
    technique?: string;     // "Remove dead wood, shape canopy"
    frequency?: string;     // "Annually"
  },
  temperature?: {
    idealRange?: string;    // "15-25°C"
    hardiness?: string;     // "USDA Zone 8-9"
    humidity?: string;      // "Moderate humidity"
  },
  pests?: {
    common?: string;        // "Aphids, scale insects"
    prevention?: string;    // "Regular inspection, neem oil"
    treatment?: string;     // "Insecticidal soap"
  },
  repotting?: {
    frequency?: string;     // "Every 2-3 years"
    timing?: string;        // "Early spring"
    potSize?: string;       // "One size larger"
  },
  harvesting?: {
    timing?: string;        // "When fruit is fully colored"
    technique?: string;     // "Cut with stem attached"
    storage?: string;       // "Cool, dry place"
  },
  warnings?: string[];      // ["Toxic to pets", "Avoid overwatering"]
  tips?: string[];          // ["Mulch in summer", "Prune after flowering"]
}
```

### File modificati
- `supabase/functions/gemini/index.ts`
- `types.ts` (aggiunti tipi StructuredCarePlan)
- `services/geminiService.ts` (aggiornato generateDetailedCarePlan)

---

## ✅ TASK #22: Refactoring homepage UX

### Stato: COMPLETATO (in review)

### Documento Design

Vedi `TASK22-Homepage-UX-Refactoring.md` per il documento completo.

### Problema
Homepage attuale raggruppa task per tempo (overdue, today, this_week, this_month) → con tante piante diventa scroll infinito.

### Soluzione
Raggruppare per **tipo di lavorazione** con accordion espandibili:

```
🔴 URGENTI (3)
├─ Melo: Potatura (-3gg)
├─ Pero: Concimazione (-5gg)
└─ Rosm: Trapianto (oggi)

✂️ POTATURA (2 piante) ▼
├─ 🍎 Melo - Potatura formazione
│  ├─ ☐ Potatura formazione
│  └─ ☐ Taglia rami secchi
└─ 🍐 Pero - Potatura verde
   └─ ☐ Rimuovi succhioni

💧 IRRIGAZIONE (5 piante) ▶
🧪 CONCIMATIONE (3 piante) ▶
🍎 RACCOLTA (2 piante) ▶
```

### Componenti proposti
- `WorkCategory` - Accordion per categoria
- `PlantWorkCard` - Card pianta con task
- `SubtaskChecklist` - Subtask spuntabili
- `useGroupedTasks` - Hook per raggruppare task

### Migration proposta
Vedere sezione "Database Migration" nel documento per tabella `botanica_subtasks`.

---

## ✅ TASK #23: Sistema cronologia e note per pianta

### Stato: COMPLETATO (in review)

### Schema Database

Tabella: `botanica_plant_notes`

```sql
CREATE TABLE botanica_plant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES botanica_plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT,
  category TEXT DEFAULT 'general', -- general, planting, pruning, fertilizing, pest, observation, harvest, transplant, other
  tags TEXT[],
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE, -- ⭐ Timestamp personalizzabile
  entry_time TIME WITHOUT TIME ZONE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  weather_context JSONB,
  attachments JSONB DEFAULT '[]'
);
```

### Feature
- ✅ Timestamp personalizzabile (può essere nel passato)
- ✅ Categorie predefinite con icone e colori
- ✅ Tag personalizzabili
- ✅ Pinning note importanti
- ✅ Soft delete (archivio)
- ✅ Raggruppamento temporale (Oggi, Questa settimana, Questo mese, Precedenti)
- ✅ Supporto meteo (opzionale)

### File creati
1. **Migration SQL** (`004_plant_notes_diary.sql`)
   - Tabella con RLS
   - Indici per performance
   - Views utili
   - Funzioni helper

2. **Service** (`plantNotesService.ts`)
   - CRUD completo
   - Ricerca full-text
   - Filtri per tag/categoria
   - Raggruppamento temporale
   - Migrazione da legacy notes

3. **Componente React** (`PlantDiary.tsx`)
   - UI per aggiungere/editare note
   - Selezione data personalizzata
   - Dropdown categorie
   - Input tags
   - Lista raggruppata per tempo
   - Pin/unpin
   - Delete con conferma

### Esempio utilizzo

```typescript
// Aggiungere nota con data nel passato
await createPlantNote({
  plantId: 'uuid-nashi',
  content: 'Piantato il nashi nel frutteto sud',
  title: 'Piantumazione nashi',
  category: 'planting',
  entryDate: '2025-10-15', // ⭐ Data personalizzata!
  tags: ['frutteto-sud', 'nuova-pianta']
});

// Aggiungere nota "libertina"
await createPlantNote({
  plantId: 'uuid-pero',
  content: 'Ha bisogno di formazione perché è un alberello libertino',
  category: 'pruning',
  tags: ['urgente', 'formazione']
});
```

---

## 📋 Checklist implementazione

### Task #21
- [x] Modificare edge function
- [x] Aggiungere tipi TypeScript
- [x] Aggiornare service frontend
- [ ] Testare con Gemini API
- [ ] Aggiornare PlantDetailScreen per usare nuovo formato

### Task #22
- [x] Documento design
- [x] Schema dati
- [x] Migration SQL subtasks
- [ ] Implementare hook useGroupedTasks
- [ ] Implementare componenti WorkCategory, PlantWorkCard
- [ ] Aggiornare HomeScreen

### Task #23
- [x] Migration SQL
- [x] Tipi TypeScript
- [x] Service CRUD
- [x] Componente PlantDiary
- [ ] Eseguire migration su Supabase
- [ ] Integrare PlantDiary in PlantDetailScreen
- [ ] Aggiungere tab "Diario" in PlantDetailScreen

---

## 📁 File in questo pacchetto

| File | Descrizione |
|------|-------------|
| `gemini-edge-function.ts` | Edge function Gemini modificata |
| `types.ts` | Tipi TypeScript aggiornati |
| `geminiService.ts` | Service Gemini aggiornato |
| `plantNotesService.ts` | Service per gestione note pianta |
| `PlantDiary.tsx` | Componente React diario pianta |
| `004_plant_notes_diary.sql` | Migration database note |
| `TASK22-Homepage-UX-Refactoring.md` | Documento design UX homepage |
| `README.md` | Questo file |

---

## 🚀 Prossimi passi consigliati

1. **Eseguire migration SQL** su Supabase:
   ```bash
   supabase db push
   ```

2. **Testare edge function** con Gemini API:
   ```bash
   supabase functions deploy gemini
   ```

3. **Integrare componenti** in PlantDetailScreen:
   - Aggiungere tab "Piano di cura" con nuovo formato JSON
   - Aggiungere tab "Diario" con PlantDiary component

4. **Implementare nuova UX homepage** con useGroupedTasks

---

*Generato automaticamente da botanica-caretaker per Federico*
