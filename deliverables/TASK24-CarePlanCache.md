# Task #24: Cache Piano di Cura + Rigenerazione Smart

## Descrizione
Implementazione del sistema di caching del piano di cura delle piante con rigenerazione intelligente.

## Requisiti soddisfatti
- ✅ Salva il piano di cura in cache nel database (JSONB)
- ✅ Rigenerazione SOLO quando:
  1. Cron job periodico (~15gg)
  2. Nota aggiunta alla pianta
  3. Modifica scheda pianta
  4. Bottone "Rigenera" manuale

## File implementati

### 1. Migration SQL
**File:** `supabase/migrations/005_care_plan_cache.sql`

Aggiunge campi alla tabella `botanica_plants`:
- `cached_care_plan` (JSONB) - contiene il piano strutturato
- `care_plan_generated_at` (TIMESTAMPTZ) - timestamp ultima generazione
- `care_plan_needs_regeneration` (BOOLEAN) - flag per rigenerazione manuale

Trigger automatici:
- `trigger_invalidate_care_plan_cache` - invalida cache su modifica pianta
- `trigger_invalidate_care_plan_on_note` - invalida cache su nuova nota

Funzioni helper:
- `is_care_plan_expired()` - verifica scadenza cache
- `cache_care_plan()` - salva piano in cache
- `request_care_plan_regeneration()` - richiede rigenerazione

### 2. Edge Function - Gemini (aggiornata)
**File:** `supabase/functions/gemini/index.ts`

Aggiornata funzione `generateDetailedCarePlan`:
- Supporta parametro `format` per retro-compatibilità
- Restituisce JSON strutturato con schema uniforme
- Helper `generateMarkdownFromCarePlan` per retro-compatibilità

### 3. Edge Function - Care Plan Cache
**File:** `supabase/functions/careplan-cache/index.ts`

Endpoint per cron job con azioni:
- `regenerateExpired` - marca piante con cache scaduta per rigenerazione
- `regeneratePlant` - rigenerazione manuale singola pianta
- `getStats` - statistiche cache

### 4. Types TypeScript (aggiornati)
**File:** `types.ts`

Aggiunti campi a `Plant`:
```typescript
cachedCarePlan?: StructuredCarePlan | null;
carePlanGeneratedAt?: string | null;
carePlanNeedsRegeneration?: boolean;
```

### 5. Supabase Service (aggiornato)
**File:** `services/supabaseService.ts`

Aggiunti metodi:
- `cacheCarePlan()` - salva piano in cache
- `requestCarePlanRegeneration()` - richiede rigenerazione
- `getCachedCarePlan()` - recupera piano valido dalla cache
- `getPlantsNeedingCarePlanRegeneration()` - per cron job

### 6. Gemini Service (aggiornato)
**File:** `services/geminiService.ts`

Aggiornata funzione `generateDetailedCarePlan`:
- Parametro `forceRegenerate` per bypass cache
- Parametro `cachedPlan` per usare cache esistente
- Return type include `fromCache` boolean

### 7. Plant Detail Screen (aggiornato)
**File:** `screens/PlantDetailScreen.tsx`

Aggiunto:
- Bottone "Rigenera" con icona rotate
- Indicator cache ("From cache" / "Freshly generated")
- Timestamp ultima generazione
- Logica di caricamento con cache

### 8. useGarden Hook (aggiornato)
**File:** `hooks/useGarden.ts`

Aggiunti metodi:
- `updatePlantNotes()` - aggiorna note (triggera invalidazione cache)
- `updatePlantDetails()` - modifica dettagli pianta
- `regenerateCarePlan()` - richiede rigenerazione manuale
- `cacheCarePlan()` - salva piano generato in cache

## Logica di rigenerazione

1. **Apertura scheda pianta:**
   - Verifica se esiste piano in cache
   - Se cache valida (<15gg) → usa cache
   - Se cache scaduta/assente → chiama Gemini e salva in cache

2. **Aggiunta nota (via trigger DB):**
   - Trigger SQL invalida automaticamente cache
   - Prossima apertura scheda → rigenerazione

3. **Modifica scheda pianta (via trigger DB):**
   - Trigger SQL invalida automaticamente cache
   - Prossima apertura scheda → rigenerazione

4. **Bottone "Rigenera":**
   - Invalida cache immediatamente
   - Chiama Gemini e salva nuovo piano

5. **Cron job (~15gg):**
   - Edge function marca piante scadute
   - Rigenerazione differita alla prossima apertura

## Configurazione Cron Job (Supabase)

Aggiungere in Supabase Dashboard > Database > Cron Jobs:

```sql
SELECT cron.schedule(
  'regenerate-care-plans',
  '0 2 */15 * *',  -- Ogni 15 giorni alle 2:00
  $$
    SELECT net.http_post(
      url:='https://your-project.supabase.co/functions/v1/careplan-cache',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"action": "regenerateExpired", "maxAgeDays": 15, "batchSize": 50}'::jsonb
    ) AS request_id;
  $$
);
```

## Note i18n

Chiavi di traduzione aggiunte:
- `regenerateCarePlan` - tooltip bottone
- `regenerate` - testo bottone
- `fromCache` - "From cache"
- `freshlyGenerated` - "Freshly generated"
- `generatedToday` - "Generated today"
- `generatedYesterday` - "Generated yesterday`
- `generated` / `daysAgo` - "X days ago"

## Test Checklist

- [ ] Apertura pianta senza cache → generazione nuova
- [ ] Apertura pianta con cache valida → uso cache (istantaneo)
- [ ] Apertura pianta con cache scaduta → rigenerazione
- [ ] Click "Rigenera" → nuova generazione immediata
- [ ] Aggiunta nota → invalidazione cache (trigger DB)
- [ ] Modifica pianta → invalidazione cache (trigger DB)
- [ ] Cron job → marca piante scadute

## Performance

- Cache hit: ~0ms (dati locali)
- Cache miss (Gemini): ~2-5s
- Riduzione chiamate API: ~90% (assumendo apertura scheda 10x prima di scadenza)
