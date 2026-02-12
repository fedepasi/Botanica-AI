# Botanica AI - Code Audit Report

**Data audit:** 2026-02-10  
**Auditor:** Dev Lead (AI Agent)  
**Repository:** /root/.openclaw/workspace/Botanica-AI  
**Versione:** 0.0.0

---

## 1. Executive Summary

Botanica AI è un'applicazione React + TypeScript + Vite per la gestione di orti e giardini con assistenza AI. L'app utilizza Supabase per backend/auth/storage e Google Gemini per l'AI (identificazione piante, generazione piani di cura, chat).

### Stato Generale
- **Codice:** Medio-alto livello qualitativo
- **Architettura:** Solido pattern React Context + Hooks
- **Prontezza Produzione:** ~75% - Richiede alcuni fix critici prima del lancio
- **Scalabilità SaaS:** Richiede refactoring significativo per freemium

---

## 2. Architettura & Pattern

### 2.1 Stack Tecnologico
| Componente | Tecnologia | Versione | Stato |
|------------|------------|----------|-------|
| Framework | React | ^19.2.0 | ✅ Moderno |
| Build Tool | Vite | ^6.2.0 | ✅ Ottimo |
| Backend/Auth | Supabase | ^2.95.3 | ✅ Solido |
| AI | @google/genai | ^1.28.0 | ✅ Ultima versione |
| Router | react-router-dom | ^7.13.0 | ✅ Moderno |
| Styling | Tailwind CSS | (implied) | ✅ OK |
| PWA | vite-plugin-pwa | ^1.2.0 | ✅ Presente |

### 2.2 Struttura dei File
```
App.tsx (root)
├── screens/ (8 screens)
├── components/ (2 components - troppo pochi)
├── contexts/ (3 contexts)
├── hooks/ (3 hooks)
├── services/ (4 services)
├── i18n/ (2 lingue)
└── types.ts (types centralizzati)
```

**Valutazione:** Struttura pulita ma manca una cartella `utils/` e `constants/`. Troppi componenti inline nelle screens.

### 2.3 Pattern Utilizzati

✅ **Pattern Positivi:**
- React Context per stato globale (Auth, Language, Careplan)
- Custom hooks per logica riutilizzabile
- TypeScript con tipi ben definiti
- Error Boundary in App.tsx
- HashRouter per SPA statica
- Separazione concerns: services per API calls

⚠️ **Pattern Migliorabili:**
- Manca React Query/SWR per data fetching (stato server vs stato client mescolato)
- No code splitting/lazy loading
- Alcuni componenti troppo grandi (>300 linee)
- Manca caching strategico per chiamate AI costose

---

## 3. Sicurezza Analysis

### 🔴 PROBLEMI CRITICI (Alta Priorità)

| # | Problema | File | Rischio | Fix |
|---|----------|------|---------|-----|
| 1 | **API Keys in environment client-side** | vite.config.ts, geminiService.ts, supabaseClient.ts | 🔴 **ALT** | Le chiavi API Gemini e Supabase sono esposte nel bundle client. Limitare scope delle chiavi su Google Cloud Console. Aggiungere rate limiting. |
| 2 | **Nessuna validazione input** | Tutti gli screen | 🔴 **ALT** | Input utente passati direttamente a Supabase senza sanitization. Aggiungere zod/yup validation. |
| 3 | **XSS potenziale** | PlantDetailScreen.tsx, ChatScreen.tsx | 🟡 **MED** | `dangerouslySetInnerHTML` usato per markdown rendering di Gemini. Sanitizzare con DOMPurify. |
| 4 | **Nessun rate limiting AI** | geminiService.ts | 🔴 **ALT** | Chiamate dirette a Gemini senza throttling. Un utente malintenzionato può esaurire quota. |
| 5 | **URL immagini base64 in storage** | AddPlantScreen.tsx | 🟡 **MED** | Blob generati da base64 senza validazione MIME type/size. |

### Codice Vulnerabile Identificato

```typescript
// PlantDetailScreen.tsx - Rischio XSS
dangerouslySetInnerHTML={{ __html: carePlan }}
// Soluzione: usare react-markdown + DOMPurify

// supabaseService.ts - SQL Injection potenziale
// Non applica sanitization sui filtri dinamici
```

---

## 4. Performance Analysis

### 🔴 Bottleneck Critici

| # | Problema | Impatto | Soluzione |
|---|----------|---------|-----------|
| 1 | **Re-render eccessivi** | 🔴 Alto | CareplanContext ricalcola tutto ad ogni cambio. Usare `useMemo` strategico o splitting context. |
| 2 | **Nessun caching immagini** | 🔴 Alto | Immagini piante ricaricate ogni volta. Implementare lazy loading + caching. |
| 3 | **Chiamate AI sincrone** | 🟡 Medio | `generateAnnualCareplan` blocca UI. Spostare in Web Worker o usare streaming. |
| 4 | **Bundle size** | 🟡 Medio | @google/genai è pesante. Considerare dynamic import. |
| 5 | **Nessuna pagination** | 🟡 Medio | Tasks, plants tutti caricati in memoria. Paginare Supabase. |

### Metriche Stimate
- **Time to Interactive:** ~3-4s (simulato su mobile 3G)
- **First Contentful Paint:** ~1.5s
- **Bundle Size:** ~450KB gzipped (stimato)

---

## 5. UX/UI Issues

### 🟡 Problemi Identificati

1. **No offline support** - PWA registrata ma nessun service worker custom per offline
2. **No error states design** - Solo toast generici, nessuna UI dedicata
3. **Loading states inconsistenti** - Mix di Spinner e skeleton mancanti
4. **No retry mechanism** - Se AI fallisce, l'utente non può riprovare facilmente
5. **Manca feedback tattile** - Su mobile mancano haptic feedback per azioni importanti
6. **No empty states personalizzati** - Messaggi generici

### 🔴 Bug UX Potenziali

```typescript
// AddPlantScreen.tsx - Bug logico
const handleAddPlant = async () => {
  // Se imageUrl è base64 (data:image...), upload a Supabase
  // MA: se upload fallisce, plant viene creato senza immagine?
  // Non c'è transazione atomica
}
```

---

## 6. Bug & Problematiche Codice

### 🔴 Bug Confermati

| # | Bug | File | Linea | Fix |
|---|-----|------|-------|-----|
| 1 | **updatePlantNotes non implementato** | supabaseService.ts | N/A | Funzione stub, non salva notes nel DB |
| 2 | **Memory leak in AddPlantScreen** | AddPlantScreen.tsx | useEffect | Stream camera non sempre cleanup su unmount |
| 3 | **Race condition in CareplanContext** | CareplanContext.tsx | init | hasInitialized ref non gestisce concorrenza |
| 4 | **Tipo errato in mapRowToTask** | supabaseService.ts | 16 | `weather_at_completion` tipato come WeatherInfo ma DB ha JSON |

### 🟡 Code Smells

```typescript
// 1. Any type inappropriato
const [resultData, setResultData] = useState<any>(null); // AddPlantScreen.tsx

// 2. Console.error senza user feedback
console.error('Adaptation failed:', e); // CareplanContext.tsx

// 3. Magic numbers
setTimeout(() => setIsSavingNotes(false), 1500); // PlantDetailScreen.tsx

// 4. Callback non memoizzati
const handleClick = () => { ... } // TaskItem.tsx - ricreato ogni render

// 5. Props drilling implicito
// useTranslation dipende da LanguageContext ma non c'è type safety su fallback
```

---

## 7. Miglioramenti Prioritizzati

### 🔴 ALTO IMPATTO (Pre-lancio)

1. **Sicurezza:**
   - [ ] Implementare DOMPurify per markdown rendering
   - [ ] Aggiungere rate limiting API Gemini (throttling + debounce)
   - [ ] Validare tutti gli input con Zod
   - [ ] Configurare RLS policies su Supabase (verificare!)

2. **Performance:**
   - [ ] Implementare React Query per caching server state
   - [ ] Aggiungere virtual scrolling per liste lunghe
   - [ ] Lazy load screens con React.lazy()
   - [ ] Ottimizzare immagini (WebP, dimensioni responsive)

3. **Bug Fix:**
   - [ ] Implementare updatePlantNotes nel service
   - [ ] Fix memory leak camera
   - [ ] Aggiungere cleanup corretti useEffect

### 🟡 MEDIO IMPATTO (Post-lancio)

4. **UX:**
   - [ ] Aggiungere retry per errori AI
   - [ ] Implementare skeleton screens
   - [ ] Migliorare stati vuoti
   - [ ] Aggiungere feedback tattile

5. **DevEx:**
   - [ ] Aggiungere ESLint + Prettier configurazione
   - [ ] Implementare test unitari (Vitest)
   - [ ] Aggiungere error tracking (Sentry)
   - [ ] Setup CI/CD pipeline

6. **Architettura:**
   - [ ] Separare UI components in cartella dedicata
   - [ ] Creare utils/ per helper functions
   - [ ] Aggiungere constants/ per valori statici

### 🟢 BASSO IMPATTO (Future iterations)

7. **Feature:**
   - [ ] Dark mode
   - [ ] Notifiche push per task
   - [ ] Condivisione piante tra utenti
   - [ ] Export dati garden

8. **Ottimizzazioni:**
   - [ ] Prefetching routes
   - [ ] Service worker custom
   - [ ] Analytics opt-in

---

## 8. Prontezza Produzione

### Checklist Lancio

| Criterio | Stato | Note |
|----------|-------|------|
| Autenticazione funzionante | ✅ | Supabase Auth OK |
| Database persistence | ✅ | Supabase + RLS necessario |
| PWA installabile | ✅ | Manifest presente |
| Responsive design | ✅ | Tailwind classes OK |
| Error handling base | ⚠️ | Migliorabile |
| Performance mobile | ⚠️ | Test necessario |
| Security audit | ❌ | Fix critici richiesti |
| Test coverage | ❌ | Zero test presenti |
| Monitoring | ❌ | Sentry non configurato |
| Documentazione | ⚠️ | Solo README base |

### 🎯 Stima: 75% pronto

**Cosa manca per il lancio:**
1. Fix XSS e sanitizzazione input
2. Rate limiting API
3. RLS policies verificate
4. Test E2E base (almeno flusso auth + add plant)
5. Privacy policy & ToS

---

## 9. Roadmap SaaS Freemium

### Fase 1: Foundation (2 settimane)
- [ ] Refactor contexts → React Query
- [ ] Implementare feature flags
- [ ] Setup Stripe per pagamenti
- [ ] Creare tier plans (Free/Pro/Premium)

### Fase 2: Feature Gating (1 settimana)
```typescript
// Esempio implementazione
type Feature = 'unlimited_plants' | 'ai_chat' | 'weather_alerts' | 'export_data';

const FEATURE_LIMITS = {
  free: { maxPlants: 3, features: ['basic_careplan'] },
  pro: { maxPlants: 15, features: ['ai_chat', 'weather_alerts'] },
  premium: { maxPlants: Infinity, features: ['all'] }
};
```

### Fase 3: API & Backend (2 settimane)
- [ ] Spostare AI calls su edge functions (sicurezza)
- [ ] Implementare usage tracking
- [ ] Setup webhook Stripe
- [ ] Caching layer (Redis)

### Fase 4: Enterprise (opzionale)
- [ ] Multi-user gardens (teams)
- [ ] API pubblica
- [ ] White-label option

### Schema Database Freemium
```sql
-- subscriptions table
create table botanica_subscriptions (
  user_id uuid references auth.users primary key,
  tier text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamp,
  current_period_end timestamp,
  created_at timestamp default now()
);

-- usage tracking
create table botanica_usage (
  user_id uuid,
  month int,
  year int,
  ai_calls int default 0,
  plants_added int default 0,
  primary key (user_id, month, year)
);
```

---

## 10. Raccomandazioni Immediate

### Questa settimana:
1. **Fix XSS:** Installare DOMPurify e sanitizzare output markdown
2. **RLS:** Verificare tutte le Supabase policies
3. **Rate limiting:** Implementare throttling per chiamate AI

### Prossima settimana:
4. **Testing:** Setup Vitest + test Auth flow
5. **React Query:** Migrare useGarden e useCareplan
6. **Monitoring:** Configurare Sentry

---

## 11. Conclusioni

Botanica AI è un'applicazione solida con buone fondamenta architetturali. Il codice è mantenibile e segue le best practice React moderne. Tuttavia, **richiede interventi critici su sicurezza e performance prima di un lancio pubblico**.

I principali rischi sono:
1. Costi AI non controllati (no rate limiting)
2. Esposizione dati se RLS non configurato correttamente
3. Esperienza utente degradata su mobile con molte piante

Con i fix suggeriti, l'app è pronta per scalare a un modello SaaS freemium.

---

*Report generato automaticamente. Per domande o chiarimenti, contattare il Dev Lead.*
