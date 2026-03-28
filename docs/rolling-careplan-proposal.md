# Rolling Care Plan — Proposta Tecnica
**Data:** 28 Marzo 2026  
**Autore:** Anica 🌱  
**Status:** Solo analisi — nessuna implementazione  
**Richiesta da:** Federico Pasinetti

---

## 1. Situazione attuale (codice reale)

### Come funziona oggi

`generateAnnualCareplan` (edge function `gemini/index.ts` case 500–600) manda a Gemini un prompt che chiede **15-30 task distribuiti su 12 mesi** in una singola chiamata. Il risultato viene salvato in `botanica_tasks` via `supabaseService.createTasks()`.

Ogni task ha: `scheduled_month`, `window_start`, `window_end`, `category`, `task_nature`, `priority`, `task` (testo), `reason` (testo).

`adaptBiweeklyTasks` gira ogni 15 giorni (`shouldAdapt` controlla `adaptation_log`): prende i task pending dei prossimi 30 giorni + i task completati recenti + meteo, e chiede a Gemini di generare nuovi task routinari (irrigazione) e modificare le finestre temporali dei task esistenti.

### Problemi reali che confermano la proposta

1. **Costo chiamata Gemini:** 15-30 task in JSON strutturato con responseSchema complessa = token output significativi. Con molte piante, la somma è pesante.
2. **Precisione a 10 mesi:** Gemini sa che a ottobre "si potano le rose" ma non può sapere se quell'ottobre sarà piovoso. I task lontani sono necessariamente generici.
3. **Testo task libero:** ogni pianta genera testo diverso per lo stesso concetto ("Potatura di formazione", "Potare per dare forma", "Intervento di potatura strutturale") — impossibile da uniformare, impossibile da arricchire con istruzioni dettagliate.
4. **Note utente sottoutilizzate:** in `adaptBiweeklyTasks` le note entrano nel prompt ma con peso basso — Gemini le vede come contesto, non come vincolo.

---

## 2. Valutazione della proposta di Federico

### A) Rolling 3-Month Buffer ✅ Solido

**Il ragionamento è corretto.** I task a +10 mesi non aggiungono valore reale — l'utente non li guarda, Gemini non può essere preciso su condizioni future, e occupano slot DB inutilmente.

**Come funzionerebbe nel codice:**

Invece di `generateAnnualCareplan` che genera tutto, serve una nuova action in edge function — chiamiamola `generateRollingBuffer`:

```
Input: plant, coords, weather, fromMonth, toMonth (es. marzo → giugno)
Output: task per quella finestra di 3-4 mesi
```

Il trigger "espandi buffer" ogni 1° del mese può essere integrato in `checkAdaptation` (già gira ogni 15 giorni) con una logica aggiuntiva:

```typescript
// In CareplanContext.checkAdaptation():
const latestTask = maxBy(allTasks, t => t.windowEnd);
const bufferEndMonth = getMonth(latestTask.windowEnd); // es. giugno
const currentMonth = getMonth(now); // es. aprile
const bufferMonthsAhead = bufferEndMonth - currentMonth; // = 2

if (bufferMonthsAhead < 3) {
  // genera il mese mancante: luglio
  await generateRollingBuffer(plant, currentMonth + 3);
}
```

**Complicazione da risolvere:** il sistema attuale usa `scheduledMonth` (intero 1-12) come indice — con il rolling buffer bisogna stare attenti agli anni (dicembre + 3 = marzo anno successivo). Non è un problema insormontabile ma va gestito esplicitamente.

**DB:** nessuna modifica alla tabella `botanica_tasks`. Il rolling buffer è solo una logica di generazione diversa, i task vengono salvati nello stesso posto.

---

### B) Catalogo task template ⚠️ Ottima idea, implementazione da pesare

**Il valore è chiaro:** testo uniforme, istruzioni dettagliate scritte una volta, generazione veloce (Gemini assegna ID template invece di inventare testo).

**Due possibili architetture:**

#### Opzione B1 — Template lato client (JSON statico, zero DB)

Un file `taskTemplates.json` nel frontend con ~50 template. Struttura:

```json
{
  "pruning_formative": {
    "id": "pruning_formative",
    "category": "pruning",
    "label_it": "Potatura di formazione",
    "label_en": "Formative pruning",
    "instructions_it": "Esegui la potatura di formazione quando la pianta è in dormienza...",
    "instructions_en": "Perform formative pruning when the plant is dormant...",
    "tools": ["forbici da potatura", "disinfettante"],
    "common_mistakes": ["tagliare troppo vicino al nodo", "non disinfettare le lame"],
    "applicable_to": ["alberi_da_frutto", "rose", "arbusti"]
  },
  "fertilizing_spring_npk": { ... },
  "antifungal_preventive": { ... }
}
```

Gemini, invece di scrivere `task: "Potatura di formazione"`, restituisce `templateId: "pruning_formative"`. Il frontend fa il lookup nel JSON e mostra le istruzioni complete.

**Pro:** Zero migrazione DB. Deploy immediato. Template aggiornabili senza toccare il backend.  
**Contro:** Il file JSON va mantenuto. Gemini deve conoscere gli ID template (vanno inclusi nel prompt). Se Gemini assegna un template sbagliato, il testo mostrato è fuorviante.

#### Opzione B2 — Template in DB (nuova tabella Supabase)

```sql
CREATE TABLE botanica_task_templates (
  id TEXT PRIMARY KEY,              -- 'pruning_formative'
  category TEXT NOT NULL,
  label_it TEXT NOT NULL,
  label_en TEXT NOT NULL,
  instructions_it TEXT,             -- 200-300 parole
  instructions_en TEXT,
  tools JSONB,                      -- ["forbici", "disinfettante"]
  common_mistakes JSONB,
  applicable_species TEXT[],        -- null = universale
  created_at TIMESTAMPTZ DEFAULT now()
);
```

E aggiungi `template_id TEXT REFERENCES botanica_task_templates(id)` alla tabella `botanica_tasks`.

**Pro:** Template centralizzati, versionabili, aggiornabili senza deploy frontend. Query possibile ("tutti gli utenti con task 'pruning_formative' scaduti").  
**Contro:** Richiede nuova migrazione Supabase (da far girare da Federico). RLS da configurare. Più complessità.

**Raccomandazione:** Iniziare con B1 (JSON statico). Se i template diventano >100 o serve analisi cross-utente, migrare a B2 in M3. La complessità di B2 non è giustificata per la beta.

---

### C) Note utente con più peso ✅ Fix semplice, alto impatto

Il codice attuale in `adaptBiweeklyTasks` include le note nel prompt ma come contesto generico. Per dargli più peso:

```typescript
// PRIMA (note come contesto passivo):
`- ${p.name}: ${p.careNeeds}${p.notes ? ` | Notes: ${p.notes}` : ""}`

// DOPO (note come vincolo esplicito):
`- ${p.name}: ${p.careNeeds}
  ${p.notes ? `⚠️ IMPORTANT USER CONSTRAINTS: "${p.notes}" — These notes override default care recommendations. Prioritize tasks that address these specific concerns.` : ""}`
```

E nella generazione del rolling buffer, le note devono influenzare la selezione dei template:

```
If user notes mention "appartamento" or "balcone" → deprioritize soil amendment tasks
If notes mention "biologico" → avoid pest_chemical template, prefer pest_biological
If notes mention "prima volta" → increase task detail level, add more "beginner" templates
```

Questo si implementa direttamente nel prompt, senza modifiche DB.

---

## 3. Architettura proposta (schema completo)

```
INSERIMENTO PIANTA
      │
      ▼
generateRollingBuffer(plant, mese_corrente, mese_corrente+3)
      │ → 8-15 task (invece di 15-30 annuali)
      │ → template assegnati da Gemini (B1: templateId, B2: DB lookup)
      ▼
botanica_tasks (invariata)
      │
      ├─── OGNI 15 GIORNI (checkAdaptation esistente)
      │         │
      │         ├── shouldAdapt? → adaptBiweeklyTasks (invariato)
      │         │
      │         └── bufferMonthsAhead < 3?
      │                   │
      │                   └── generateRollingBuffer(mese+3) → nuovi task
      │
      └─── FRONTEND (invariato)
               │
               ├── DisplayTask con timing (overdue/today/this_week/etc)
               └── Se task.templateId → lookup in taskTemplates.json → mostra istruzioni
```

### Modifiche per componente

| Componente | Modifica | Effort |
|-----------|---------|--------|
| `gemini/index.ts` | Nuova case `generateRollingBuffer` | 2-3h |
| `gemini/index.ts` | Modifica prompt `adaptBiweeklyTasks` (note peso maggiore) | 30min |
| `CareplanContext.tsx` | Logica "espandi buffer se <3 mesi avanti" in `checkAdaptation` | 1-2h |
| `CareplanContext.tsx` | Sostituire chiamata `generateAnnualCareplan` con `generateRollingBuffer` | 30min |
| `taskTemplates.json` (nuovo) | ~50 template scritti | 3-4h (Content + Agronomo) |
| `PlantDetailScreen.tsx` | Lookup template e mostra istruzioni dettagliate | 1-2h |
| `geminiService.ts` | Nuova funzione `generateRollingBuffer()` | 30min |
| Supabase migration (opz.) | Solo se si sceglie B2 | 1h + deploy Federico |

**Effort totale stimato:** 8-13h di sviluppo. Nessuna migrazione DB obbligatoria se si sceglie B1.

---

## 4. Rischi e considerazioni

### Rischio 1 — Buco di copertura nel rolling buffer
Se l'utente non apre l'app per 3 mesi, il buffer non si espande e il mese "nuovo" non viene generato. 
**Mitigazione:** All'apertura dell'app, `checkAdaptation` controlla sempre lo stato del buffer e genera i mesi mancanti se necessario. Non serve un cron job esterno.

### Rischio 2 — Template ID sbagliati da Gemini
Gemini potrebbe assegnare `pruning_formative` a una pianta annuale come il basilico che non si pota in modo strutturale.
**Mitigazione:** Includere nel prompt la lista dei template con `applicable_to` come hint. Aggiungere validazione lato client: se `templateId` non è nel JSON → usa testo generato da Gemini come fallback.

### Rischio 3 — Complessità dell'anno-roll per il buffer
Il buffer che parte a novembre deve generare task fino a febbraio dell'anno successivo. `scheduledMonth` (1-12) non gestisce questo nativamente.
**Mitigazione:** Aggiungere `scheduled_year` alla tabella task (migration semplice) o gestirlo con `window_start`/`window_end` che già sono date complete e non dipendono da `scheduled_month`.

### Rischio 4 — Retrocompatibilità
I task già generati con il sistema annuale non hanno `templateId`. Il frontend deve gestire entrambi i casi: task con templateId (nuovi) e task con solo testo libero (vecchi).
**Mitigazione:** `templateId` nullable. Frontend: `task.templateId ? showTemplate() : showFreeText()`. Zero impatto su utenti esistenti.

---

## 5. Cosa raccomando a Federico

**Sequenza di implementazione consigliata:**

1. **Prima cosa (30 min, alto impatto immediato):** Modifica il peso delle note in `adaptBiweeklyTasks`. Zero rischio, zero migrazione, migliora subito la qualità per chi scrive note.

2. **Seconda cosa (2-3h, core del rolling buffer):** Nuova edge function `generateRollingBuffer` + logica espansione in `CareplanContext`. Questo risolve il problema principale (task annuali generici a 10 mesi).

3. **Terza cosa (3-5h, differenziatore UX):** Catalogo template B1 (JSON statico) con 20-30 template core. Più tardi espandibile. Questo risolve il problema "utenti non sanno cosa fare concretamente".

**Non implementare contemporaneamente** — sono cambiamenti indipendenti, meglio farli in sequenza con QA intermedio.

**La domanda prima di iniziare:** il rolling buffer cambia il trigger di generazione. Il punto 2 richiede di capire come gestire le piante che hanno già un piano annuale completo (si lasciano così fino a fine anno? si troncano i task futuri?). Federico deve decidere la policy di migrazione per gli utenti esistenti.
