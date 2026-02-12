# Botanica-AI — Deploy Checklist Pre-Beta

**Data:** 2026-02-12  
**Stato:** Pronto per deploy — attese azioni manuali

---

## ✅ Prerequisiti Completati

- [x] Build locale funzionante (496KB bundle, PWA OK)
- [x] Edge Function Gemini implementata (6 azioni)
- [x] Cache piano di cura implementata (frontend + service)
- [x] Plant Diary completo (CRUD, categorie, pinning)
- [x] Schema JSON piano di cura uniforme
- [x] XSS fix (DOMPurify)
- [x] API key spostata server-side (Edge Function)
- [x] Commit pushato su GitHub (`bb91721`)

---

## 🔧 Azioni Richieste a Federico

### 1. Migrazioni Database (5 min)

Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/khkwrkmsikpsrkeiwvjm) → SQL Editor → New query

**Esegui in ordine:**

```sql
-- File: supabase/migrations/004_plant_notes_diary.sql
-- Contenuto: [vedi file nel repo]
```

Poi:

```sql
-- File: supabase/migrations/005_care_plan_cache.sql  
-- Contenenza: [vedi file nel repo]
```

**Verifica:** Dopo l'esecuzione, in Table Editor dovresti vedere:
- `botanica_plant_notes` (nuova)
- `botanica_plants` con colonne `cached_care_plan`, `care_plan_generated_at` (aggiornata)

---

### 2. Deploy Edge Functions (3 min)

```bash
cd /path/to/Botanica-AI

# Login (se non già fatto)
supabase login

# Link progetto (se non già fatto)  
supabase link --project-ref khkwrkmsikpsrkeiwvjm

# Deploy functions
supabase functions deploy gemini
supabase functions deploy careplan-cache
```

**Verifica:** In Supabase Dashboard → Edge Functions dovresti vedere:
- `gemini` (con 6 azioni: identifyPlant, searchPlantByName, etc.)
- `careplan-cache` (ops su cache piano di cura)

---

### 3. Configurazione Secrets (2 min)

In Supabase Dashboard → Edge Functions → Secrets:

Aggiungi:
- `GEMINI_API_KEY` = [la tua API key Google AI Studio]

---

### 4. Test Rapido (5 min)

Dopo deploy:

1. Apri l'app in dev mode (`npm run dev`)
2. Aggiungi una pianta (es. "Melo")
3. Verifica che il piano di cura si generi
4. Aggiungi una nota al diario della pianta
5. Ricarica la pagina — il piano dovrebbe venire dalla cache (più veloce)

---

## 📋 Post-Deploy Checklist

- [ ] Migrazioni eseguite senza errori
- [ ] Edge Functions deployate e funzionanti
- [ ] Test aggiunta pianta OK
- [ ] Test generazione piano di cura OK
- [ ] Test cache (seconda apertura più veloce) OK
- [ ] Test diario piante OK
- [ ] Build di produzione (`npm run build`) OK
- [ ] Deploy Vercel (push su main triggera auto-deploy)

---

## 🚀 Dopo il Deploy

Una volta completato, le seguenti feature saranno attive:

1. **Diario Piante** — Note timestampate, categorie, pinning
2. **Cache Piano di Cura** — Più veloce, meno chiamate API
3. **Piano di Cura Strutturato** — JSON uniforme per tutte le specie
4. **Sicurezza** — API key Gemini solo server-side

---

## ⏱️ Stima Tempo Totale

- Migrazioni SQL: 5 min
- Deploy Edge Functions: 3 min
- Config secrets: 2 min
- Test: 5 min
- **Totale: ~15 minuti**

---

## 🆘 Troubleshooting

**Errore: "Gemini API key not found"**
→ Verifica secret `GEMINI_API_KEY` in Supabase Dashboard

**Errore: "Table not found"**  
→ Verifica migrazioni SQL eseguite (passo 1)

**Errore: "Function not found"**
→ Verifica deploy edge functions (passo 2)

**Piano di cura non si genera**
→ Controlla Network tab → chiamata a `/functions/v1/gemini`
→ Verifica response status e error message

---

*Checklist preparato da Anica 🌱 — 2026-02-12*
