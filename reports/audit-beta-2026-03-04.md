# Audit Funzionalità Beta — Botanica-AI
**Data:** 2026-03-04  
**Autore:** Anica 🌱  
**Task:** #124 (P1)  
**Scope:** Pre-beta launch audit — bug, UX, i18n

---

## 1. Mappa Funzionalità

| Area | Funzionalità | Stato |
|------|-------------|-------|
| **Auth** | Login / Signup / Logout | ✅ Funzionante |
| **Garden** | Lista piante con badge stato | ✅ Funzionante |
| **Garden** | Plant card con immagine | ✅ Funzionante |
| **Add Plant** | Upload foto → identifica AI | ✅ Funzionante |
| **Add Plant** | Camera capture → identifica AI | ✅ Funzionante |
| **Add Plant** | Ricerca per nome → AI | ✅ Funzionante |
| **Plant Detail** | Piano di cura JSON strutturato | ✅ Funzionante |
| **Plant Detail** | Cache piano + rigenera smart | ✅ Funzionante |
| **Plant Detail** | Cambio foto pianta | ✅ Funzionante |
| **Plant Detail** | Diario note (aggiungi/pin/delete) | ✅ Funzionante |
| **Plant Detail** | Tab task calendario pianta | ✅ Funzionante |
| **Chat AI** | Chat testuale con Anica | ✅ Funzionante |
| **Chat AI** | Upload/capture foto in chat | ✅ Funzionante |
| **Chat AI** | Resize automatico immagini (1024px) | ✅ Funzionante |
| **Home** | Task dashboard con categorie accordion | ✅ Funzionante |
| **Home** | UrgentBanner task scaduti/oggi | ✅ Funzionante |
| **Home** | Widget meteo (temperatura + condizioni) | ✅ Funzionante |
| **Home** | Recently Completed tasks | ✅ Funzionante |
| **Calendar** | Vista annuale con task bar | ✅ Funzionante |
| **Calendar** | Filtro per pianta | ✅ Funzionante |
| **Profile** | Switch lingua IT/EN | ✅ Funzionante |
| **Profile** | Share link app (Web Share API + clipboard fallback) | ✅ Funzionante |
| **Profile** | Badge beta tester | ✅ Funzionante |
| **Onboarding** | Flow 3 step per nuovi utenti | ✅ Funzionante |
| **PWA** | Installabile (manifest + service worker) | ✅ Funzionante |
| **Analytics** | Plausible event tracking | ✅ Implementato |
| **i18n** | IT + EN completo | ⚠️ 11 chiavi mancanti |

---

## 2. Bug Identificati

### BUG-001 [P1] — GardenScreen: badge "needs attention" su piante con task futuri

**File:** `screens/GardenScreen.tsx` righe 16-32  
**Comportamento attuale:** Una pianta mostra badge "🟡 Attenzione" se ha **qualsiasi** task pending — anche se il prossimo task è tra 3 mesi.  
**Comportamento atteso:** Badge "Attenzione" solo per task urgenti (scaduti o da fare oggi/questa settimana).  
**Impatto UX:** Confonde l'utente — vede "Attenzione" su piante che stanno benissimo.

```typescript
// BUGGY — riga 27: qualsiasi task = needs_attention
tasks.forEach(task => {
  pendingByPlant.add(task.plantId);
});
plants.forEach(plant => {
  if (pendingByPlant.has(plant.id)) {
    statuses[plant.id] = 'needs_attention'; // SBAGLIATO per task futuri
  }
});

// FIX PROPOSTO — usa timing per filtrare solo urgenti
tasks.forEach(task => {
  if (task.timing === 'overdue' || task.timing === 'today' || task.timing === 'this_week') {
    pendingByPlant.add(task.plantId);
  }
});
```

---

### BUG-002 [P2] — ChatScreen: `alert()` hardcoded non i18n

**File:** `screens/ChatScreen.tsx` riga 112  
**Problema:** Messaggio di errore resize immagine hardcoded in italiano: `alert('Errore nel ridimensionamento dell\'immagine')`.  
**Impatto:** Utenti EN vedono messaggio in italiano. Usa `alert()` nativo (brutto su mobile).

```typescript
// BUGGY
alert('Errore nel ridimensionamento dell\'immagine');

// FIX
setError(t('errorResizingImage') || 'Error resizing image');
// + aggiungere alla UI un error state instead of alert()
```

---

### BUG-003 [P2] — PlantDetailScreen: error message hardcoded in English

**File:** `screens/PlantDetailScreen.tsx` riga 240  
**Problema:** `'<p class="text-red-500">Failed to load care plan. Please try again.</p>'` — messaggio HTML hardcoded in inglese.  
**Impatto:** Utenti IT vedono errore in inglese quando il piano di cura fallisce.

```typescript
// FIX
setCarePlanHtml(`<p class="text-red-500">${t('errorCarePlan') || 'Failed to load care plan. Please try again.'}</p>`);
```

---

### BUG-004 [P2] — PlantDiary: placeholder hardcoded

**File:** `components/PlantDiary.tsx` righe 161, 168, 200  
**Problema:** I placeholder del form note usano `lang === 'it' ? '...' : '...'` inline invece di `t()`. Non rispetta il sistema i18n centralizzato.  

```typescript
// BUGGY
placeholder={lang === 'it' ? 'Titolo (opzionale)' : 'Title (optional)'}

// FIX — aggiungere chiavi i18n e usare t()
placeholder={t('noteTitlePlaceholder')}
```

---

### BUG-005 [P3] — CalendarScreen: task.task è usato come label ma può essere undefined

**File:** `screens/CalendarScreen.tsx` riga 87  
**Problema:** `{task.task}` non ha null-check. Se `task.task` è undefined la task bar è vuota senza messaggio.  

```typescript
// FIX
{task.task ?? t('unknownTask') ?? 'Task'}
```

---

## 3. UX Improvements Prioritari (Top 5)

### UX-01 [HIGH] — Fix badge "needs attention" (vedi BUG-001)

È anche un problema UX oltre che un bug. L'utente che vede tutte le piante segnate "Attenzione" perde fiducia nell'app. **Fix obbligatorio pre-beta.**

---

### UX-02 [HIGH] — Sostituire `alert()` con toast/inline error

**Problema:** L'uso di `alert()` nativo per errori immagine è UX pessima su mobile — blocca tutto con una popup brutta.  
**Soluzione:** Aggiungere un componente `Toast` o `ErrorBanner` inline nel ChatScreen.

```tsx
// Aggiungi stato error nel ChatScreen
const [uploadError, setUploadError] = useState<string | null>(null);

// Nel JSX
{uploadError && (
  <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center space-x-2">
    <i className="fa-solid fa-triangle-exclamation"></i>
    <span>{uploadError}</span>
    <button onClick={() => setUploadError(null)} className="ml-auto">×</button>
  </div>
)}
```

---

### UX-03 [MEDIUM] — Loading skeleton invece di spinner per Garden

**Problema:** Quando il Garden carica le piante, mostra uno spinner full-screen. Su connessione lenta sembra app bloccata.  
**Soluzione:** Skeleton card placeholder (2 colonne, 4 card vuote animate) durante il caricamento.

```tsx
// Skeleton placeholder
const PlantCardSkeleton = () => (
  <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-100"></div>
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
    </div>
  </div>
);
```

---

### UX-04 [MEDIUM] — Feedback visivo dopo "Aggiungi al giardino"

**Problema:** Dopo aver aggiunto una pianta, l'utente viene reindirizzato al Garden ma non c'è nessun messaggio di successo. L'utente non sa se l'aggiunta è riuscita.  
**Soluzione:** Toast di successo "🌱 [Nome pianta] aggiunta al tuo giardino!" per 3 secondi dopo l'aggiunta.

---

### UX-05 [MEDIUM] — Chat: bottone "Invia" disabilitato quando AI sta rispondendo

**Problema:** Mentre la chat AI sta rispondendo (`isTyping = true`), il bottone "Invia" non è visivamente disabilitato anche se il click viene ignorato. L'utente può pensare che l'app sia bloccata.  
**Soluzione:** Aggiungere `disabled={isTyping}` + `opacity-50` sul bottone e sul campo input.

```tsx
// In ChatScreen, input e bottone invio
<input
  disabled={isTyping}
  className={`... ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
/>
<button
  disabled={isTyping || (!inputValue.trim() && !imageFile)}
  className={`... ${(isTyping || (!inputValue.trim() && !imageFile)) ? 'opacity-50 cursor-not-allowed' : ''}`}
>
```

---

## 4. Stato i18n

### Riepilogo

| Lingua | Chiavi definite | Copertura |
|--------|----------------|-----------|
| Italiano (IT) | 126 | 100% |
| English (EN) | 126 | 100% |

**Nota:** IT e EN hanno esattamente le stesse chiavi — parità completa ✅

### Chiavi mancanti (usate nel codice ma non nei file i18n)

Queste 11 chiavi sono usate con `t('chiave')` nel codice ma non sono definite nei file locales. Il codice usa il fallback `|| 'default string'` quindi non rompono l'app, ma sono incompleto.

| Chiave | Usata in | Valore IT proposto | Valore EN proposto |
|--------|----------|-------------------|-------------------|
| `daysAgo` | PlantDetailScreen | "giorni fa" | "days ago" |
| `generated` | PlantDetailScreen | "Generato" | "Generated" |
| `generatedToday` | PlantDetailScreen | "Generato oggi" | "Generated today" |
| `generatedYesterday` | PlantDetailScreen | "Generato ieri" | "Generated yesterday" |
| `fromCache` | PlantDetailScreen | "Dalla cache" | "From cache" |
| `freshlyGenerated` | PlantDetailScreen | "Appena generato" | "Freshly generated" |
| `regenerate` | PlantDetailScreen | "Rigenera" | "Regenerate" |
| `regenerateCarePlan` | PlantDetailScreen | "Rigenera piano di cura" | "Regenerate care plan" |
| `errorUserNotLoggedIn` | AddPlantScreen | "Utente non autenticato" | "User not logged in" |
| `failedToAddPlant` | AddPlantScreen | "Aggiunta pianta fallita" | "Failed to add plant" |
| `errorResizingImage` | ChatScreen (da aggiungere) | "Errore nel ridimensionamento immagine" | "Error resizing image" |

### Chiavi definite ma non usate nel codice (11 chiavi stale)

`addNotes`, `chatTitle`, `dailyTasks`, `errorDashboard`, `errorLocation`, `errorWeather`, `myProfile`, `searchingForPlant`, `seasonalAlerts`, `startingCamera`, `upcomingTasks`

Queste chiavi possono essere rimosse o erano usate in versioni precedenti. Non causano problemi ma appesantiscono i file i18n.

---

## 5. Riepilogo Priorità Fix

### Pre-beta obbligatori (P1)
| # | Issue | File | Effort |
|---|-------|------|--------|
| 1 | BUG-001: badge needs_attention su task futuri | GardenScreen.tsx | 15 min |
| 2 | UX-02: sostituire alert() con error inline | ChatScreen.tsx | 30 min |
| 3 | i18n: aggiungere 11 chiavi mancanti | locales/it.json + en.json | 15 min |

### Consigliati per beta (P2)
| # | Issue | File | Effort |
|---|-------|------|--------|
| 4 | BUG-002: ChatScreen alert hardcoded | ChatScreen.tsx | 10 min |
| 5 | BUG-003: PlantDetail error message EN | PlantDetailScreen.tsx | 5 min |
| 6 | BUG-004: PlantDiary placeholder hardcoded | PlantDiary.tsx | 15 min |
| 7 | UX-04: toast successo "pianta aggiunta" | AddPlantScreen.tsx | 20 min |
| 8 | UX-05: input/bottone disabilitato durante AI | ChatScreen.tsx | 10 min |

### Post-beta (P3)
| # | Issue | File | Effort |
|---|-------|------|--------|
| 9 | UX-03: skeleton loader Garden | GardenScreen.tsx | 45 min |
| 10 | BUG-005: null-check task.task nel Calendar | CalendarScreen.tsx | 5 min |
| 11 | i18n: rimuovere 11 chiavi stale | locales/it+en.json | 10 min |

**Totale pre-beta:** ~60 minuti di lavoro.  
**Totale consigliati:** ~90 minuti aggiuntivi.

---

## 6. Conclusione

L'app è in ottimo stato tecnico. I bug trovati sono tutti di gravità media/bassa — nessuno blocca funzionalità core. Il più importante (BUG-001 badge falso positivo) è un problema di UX che va risolto prima che i beta tester lo vedano, perché crea confusione immediata.

**Raccomandazione:** Fissa BUG-001 + UX-02 + chiavi i18n mancanti prima del lancio beta (~60 min totali). Il resto può essere fatto in parallelo durante la fase beta.

**App pronta per beta:** ✅ Sì, dopo i 3 fix obbligatori.
