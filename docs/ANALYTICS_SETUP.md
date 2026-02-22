# Analytics Setup — Botanica AI

**Goal:** Baseline metrics pre-launch per misurare crescita post-beta  
**Stack:** Plausible Analytics (privacy-first, GDPR compliant, no cookies)  
**Alternative:** Google Analytics 4 (più potente ma richiede cookie consent)

---

## Perché Plausible

**Pro:**
- ✅ Privacy-first — no cookies, no GDPR popup needed
- ✅ Lightweight — <1KB script, non impatta performance
- ✅ Simple dashboard — metriche chiare senza overwhelming data
- ✅ EU-hosted — server in Germania, GDPR native
- ✅ €9/mese tier — copre fino a 10k page views/mese (sufficiente per beta)

**Contro:**
- ❌ Meno granulare di GA4 — no user-level tracking, no funnels avanzati
- ❌ Custom events limitati — max 30 goal/event types

**Verdict:** Perfetto per beta/early stage. Dopo 100+ utenti attivi, consider GA4 in parallel.

---

## Eventi da Tracciare

### Core User Journey

| Evento | Nome Plausible | Quando Trigger | Priority |
|--------|----------------|----------------|----------|
| **Signup** | `Signup` | User completa registrazione | P0 |
| **Login** | `Login` | User fa login (esistente) | P1 |
| **Plant Added** | `Plant:Added` | User aggiunge pianta al giardino | P0 |
| **Care Plan Generated** | `CarePlan:Generated` | Piano di cura creato (AI call) | P0 |
| **Chat Message** | `Chat:Sent` | User manda messaggio in chat AI | P1 |
| **Task Completed** | `Task:Completed` | User marca task come completato | P1 |
| **Note Added** | `Diary:NoteAdded` | User aggiunge nota al diario pianta | P2 |
| **Language Switch** | `Language:Changed` | User cambia lingua IT↔EN | P2 |
| **App Installed** | `PWA:Installed` | User installa PWA (beforeinstallprompt) | P0 |

### Retention Metrics

| Metrica | Come Misurare | Goal |
|---------|---------------|------|
| **DAU** (Daily Active Users) | Unique visitors/day | >10 in beta |
| **Retention D7** | % utenti che tornano dopo 7 giorni | >40% |
| **Avg Session Duration** | Time on site | >3 min |
| **Bounce Rate** | Single-page sessions | <60% |

---

## Implementation Plan

### Step 1: Plausible Account Setup (10 min)

1. Sign up su https://plausible.io
2. Add site: `botanica-ai.vercel.app`
3. Get tracking script:
   ```html
   <script defer data-domain="botanica-ai.vercel.app" src="https://plausible.io/js/script.js"></script>
   ```
4. Enable custom events: Settings → Goals → Add goal

### Step 2: Add Script to App (5 min)

In `index.html`:
```html
<head>
  <!-- ... existing meta tags ... -->
  
  <!-- Plausible Analytics -->
  <script defer data-domain="botanica-ai.vercel.app" src="https://plausible.io/js/script.js"></script>
</head>
```

**Note:** Plausible auto-tracks page views. No additional code needed for basic metrics.

### Step 3: Custom Events (30 min)

Create `src/utils/analytics.ts`:

```typescript
// Simple wrapper for Plausible custom events
export const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && 'plausible' in window) {
    // @ts-ignore
    window.plausible(eventName, { props });
  }
};

// Convenience functions for common events
export const Analytics = {
  signup: () => trackEvent('Signup'),
  login: () => trackEvent('Login'),
  plantAdded: (plantName: string) => trackEvent('Plant:Added', { plant: plantName }),
  carePlanGenerated: (plantId: string) => trackEvent('CarePlan:Generated', { plantId }),
  chatSent: (messageLength: number) => trackEvent('Chat:Sent', { chars: messageLength }),
  taskCompleted: (taskCategory: string) => trackEvent('Task:Completed', { category: taskCategory }),
  noteAdded: (plantId: string) => trackEvent('Diary:NoteAdded', { plantId }),
  languageChanged: (to: string) => trackEvent('Language:Changed', { language: to }),
  pwaInstalled: () => trackEvent('PWA:Installed'),
};
```

### Step 4: Integrate Events in App (1 hour)

**AuthScreen.tsx** (signup/login):
```typescript
import { Analytics } from '../utils/analytics';

// After successful signup
const handleSignUp = async () => {
  // ... existing signup logic ...
  if (!error) {
    Analytics.signup();
  }
};

// After successful login
const handleSignIn = async () => {
  // ... existing login logic ...
  if (!error) {
    Analytics.login();
  }
};
```

**AddPlantScreen.tsx** (plant added):
```typescript
import { Analytics } from '../utils/analytics';

const handleAddPlant = async () => {
  // ... existing add plant logic ...
  if (success) {
    Analytics.plantAdded(plantName);
  }
};
```

**PlantDetailScreen.tsx** (care plan generated):
```typescript
import { Analytics } from '../utils/analytics';

useEffect(() => {
  if (carePlan && !fromCache) {
    Analytics.carePlanGenerated(plantId);
  }
}, [carePlan, fromCache]);
```

**ChatScreen.tsx** (chat message):
```typescript
import { Analytics } from '../utils/analytics';

const handleSendMessage = async (text: string) => {
  // ... existing send logic ...
  Analytics.chatSent(text.length);
};
```

**HomeScreen.tsx** (task completed):
```typescript
import { Analytics } from '../utils/analytics';

const handleCompleteTask = async (taskId: string, category: string) => {
  // ... existing complete logic ...
  Analytics.taskCompleted(category);
};
```

**LanguageContext.tsx** (language switch):
```typescript
import { Analytics } from '../utils/analytics';

const setLanguage = (lang: string) => {
  // ... existing language switch logic ...
  Analytics.languageChanged(lang);
};
```

**App.tsx** (PWA install):
```typescript
import { Analytics } from '../utils/analytics';

useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // ... existing install prompt logic ...
  });

  window.addEventListener('appinstalled', () => {
    Analytics.pwaInstalled();
  });
}, []);
```

---

## Dashboard Goals (Plausible)

Configure in Plausible dashboard → Settings → Goals:

1. Custom Event: `Signup`
2. Custom Event: `Plant:Added`
3. Custom Event: `CarePlan:Generated`
4. Custom Event: `Chat:Sent`
5. Custom Event: `Task:Completed`
6. Custom Event: `PWA:Installed`

---

## Week 1 Baseline Metrics (Beta Launch)

**Expected metrics after 7 days with 10 active testers:**

| Metric | Baseline Goal |
|--------|---------------|
| Total Page Views | 200-500 |
| Unique Visitors | 10-15 |
| Avg Session Duration | 3-5 min |
| Signups | 10 |
| Plants Added | 15-30 (1.5-3 per user) |
| Care Plans Generated | 10-20 |
| Chat Messages Sent | 50-100 |
| Tasks Completed | 20-50 |
| PWA Installs | 5-8 (50-80% conversion) |

---

## Privacy & GDPR

**Plausible is GDPR-compliant by default:**
- No cookies used
- No personal data collected
- No cross-site tracking
- EU-hosted (Germany)

**No cookie banner needed** — Plausible doesn't require consent under GDPR.

**Optional: Add Privacy Policy page**

In `src/screens/PrivacyScreen.tsx`:
```markdown
# Privacy Policy

Botanica AI uses Plausible Analytics, a privacy-first analytics tool.

**What we collect:**
- Page views and navigation patterns
- Device type (mobile/desktop)
- Country (based on IP, not stored)
- Events (plant added, task completed, etc.)

**What we DON'T collect:**
- Personal information
- Cookies
- Cross-site tracking
- Email or user IDs (events are anonymous)

For more info: https://plausible.io/data-policy

Your data is never sold or shared with third parties.
```

---

## Alternative: Google Analytics 4

**If we need more advanced tracking later:**

**Setup:**
1. Create GA4 property: https://analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add gtag script:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
   </script>
   ```
4. **Add cookie consent banner** (required by GDPR)

**Trade-offs:**
- ✅ More powerful: funnels, user cohorts, advanced segmentation
- ✅ Free (no cost)
- ❌ Requires cookie consent (annoying popup for users)
- ❌ Heavier script (~45KB vs Plausible's <1KB)
- ❌ Privacy concerns (Google ownership)

**Recommendation:** Start with Plausible for beta. Consider GA4 after 100+ users if we need advanced analytics.

---

## Cost Estimate

**Plausible:**
- €9/mese (10k page views) → sufficiente per beta
- €19/mese (100k page views) → se scaling a 500+ utenti

**GA4:**
- Gratis (no limits)
- Cost = cookie consent banner tool (~€10-50/mese se usiamo CookieBot/OneTrust)

**Total analytics cost beta:** €9/mese (Plausible solo)

---

## Implementation Timeline

| Task | Time | Owner |
|------|------|-------|
| Plausible account setup | 10 min | Anica |
| Add tracking script to index.html | 5 min | Anica |
| Create analytics.ts utility | 15 min | Anica |
| Integrate events in 7 screens | 1 hour | Anica |
| Configure Plausible goals | 10 min | Anica |
| Test events in dev | 15 min | Anica |
| Deploy + verify in prod | 10 min | Anica |

**Total time:** ~2 hours  
**Target completion:** 25 Feb (domani)

---

## Next Steps

**Anica (action required):**
1. Sign up Plausible account (use fede.pasi@gmail.com or botanica-ai@... ?)
2. Implement analytics.ts + integrate in 7 screens
3. Commit + push analytics setup
4. Deploy to Vercel (auto-deploy on main push)
5. Verify events in Plausible dashboard (test signup flow)

**Federico (approval needed):**
- OK to add Plausible (€9/mese recurring cost)?
- Use which email for Plausible account?
- Should I create a Privacy Policy page or skip for beta?

**Decision:** Se Federico approva, posso implementare analytics domani in 2 ore e avere baseline metrics pronte per beta launch.
