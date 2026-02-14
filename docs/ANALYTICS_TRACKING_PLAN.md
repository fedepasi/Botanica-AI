# Botanica-AI — Analytics Tracking Plan

**Versione:** 1.0  
**Data:** 2026-02-14  
**Preparato da:** Anica 🌱  
**Scopo:** Definire gli eventi da tracciare per analizzare l'uso dell'app durante la beta

---

## 🎯 Obiettivi Analytics

1. **Misurare l'onboarding** — Dove abbandonano gli utenti?
2. **Tracciare l'engagement** — Quanto usano le feature core?
3. **Monitorare la retention** — Tornano dopo il primo uso?
4. **Identificare problemi** — Dove si bloccano gli utenti?

---

## 📊 Eventi Core da Tracciare

### 1. Onboarding Events

| Evento | Trigger | Proprietà | Priorità |
|--------|---------|-----------|----------|
| `onboarding_started` | Utente apre app primo avvio | `source`, `device_type` | P0 |
| `onboarding_step_completed` | Completa uno step onboarding | `step_number`, `step_name` | P0 |
| `onboarding_completed` | Finisce tutto l'onboarding | `duration_seconds`, `total_steps` | P0 |
| `onboarding_skipped` | Utente salta onboarding | `at_step` | P1 |
| `first_plant_added` | Prima pianta aggiunta | `identification_method`, `plant_type` | P0 |

### 2. Core Feature Events

| Evento | Trigger | Proprietà | Priorità |
|--------|---------|-----------|----------|
| `plant_identified` | AI identifica pianta | `confidence_score`, `plant_name`, `source` (camera/gallery) | P0 |
| `care_plan_viewed` | Utente apre piano di cura | `plant_id`, `from_cache` (boolean) | P0 |
| `care_plan_regenerated` | Tap su "Rigenera piano" | `plant_id`, `previous_plan_age_days` | P1 |
| `note_added` | Aggiunta nota al diario | `plant_id`, `category`, `has_photo` | P0 |
| `note_pinned` | Pin di una nota | `plant_id` | P2 |
| `task_completed` | Task spuntato come fatto | `task_type`, `plant_id`, `days_overdue` | P0 |
| `chat_message_sent` | Messaggio inviato in chat | `message_type` (text/photo), `has_context` | P1 |
| `chat_photo_uploaded` | Foto caricata in chat | `source` (camera/gallery), `resize_applied` | P1 |

### 3. Navigation & Engagement

| Evento | Trigger | Proprietà | Priorità |
|--------|---------|-----------|----------|
| `screen_view` | Cambio schermata | `screen_name`, `time_on_previous` | P0 |
| `session_start` | Avvio sessione | `source`, `campaign` (UTM) | P0 |
| `session_end` | Fine sessione | `duration_seconds`, `screens_viewed` | P0 |
| `app_background` | App va in background | `session_duration_so_far` | P1 |
| `app_foreground` | App torna in foreground | `time_in_background` | P1 |

### 4. PWA & Technical

| Evento | Trigger | Proprietà | Priorità |
|--------|---------|-----------|----------|
| `pwa_installed` | Utente installa PWA | `platform` (iOS/Android), `source` | P0 |
| `pwa_opened` | Apertura da icona home | `time_since_last_open` | P1 |
| `offline_mode_detected` | Connessione persa | `current_screen` | P2 |
| `error_occurred` | Errore JS catturato | `error_type`, `error_message`, `screen` | P0 |

---

## 🔧 Implementazione Tecnica

### Opzione A: Supabase Analytics (Consigliata per Beta)

**Vantaggi:**
- Già integrato con l'architettura esistente
- Nessun costo aggiuntivo
- Privacy-friendly (dati su Supabase di Federico)

**Implementazione:**

```typescript
// services/analyticsService.ts

export const AnalyticsEvents = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PLANT_IDENTIFIED: 'plant_identified',
  CARE_PLAN_VIEWED: 'care_plan_viewed',
  NOTE_ADDED: 'note_added',
  TASK_COMPLETED: 'task_completed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  SCREEN_VIEW: 'screen_view',
  SESSION_START: 'session_start',
  PWA_INSTALLED: 'pwa_installed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id: string;
  timestamp: string;
  properties: Record<string, any>;
  platform: 'web' | 'pwa' | 'ios' | 'android';
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.trackSessionStart();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async track(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      platform: this.detectPlatform(),
    };

    // Salva su Supabase
    await supabase.from('analytics_events').insert(event);
    
    // Backup su localStorage per retry offline
    this.queueForRetry(event);
  }

  private detectPlatform(): 'web' | 'pwa' | 'ios' | 'android' {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android';
    }
    return 'web';
  }

  private queueForRetry(event: AnalyticsEvent) {
    const queue = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
    queue.push(event);
    localStorage.setItem('analytics_queue', JSON.stringify(queue));
  }

  private trackSessionStart() {
    this.track(AnalyticsEvents.SESSION_START, {
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    });
  }
}

export const analytics = new AnalyticsService();
```

### Migration SQL per Tabella Analytics

```sql
-- supabase/migrations/006_analytics_events.sql

CREATE TABLE botanica_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  properties jsonb DEFAULT '{}',
  platform text CHECK (platform IN ('web', 'pwa', 'ios', 'android')),
  created_at timestamptz DEFAULT now()
);

-- Indici per query comuni
CREATE INDEX idx_analytics_events_name ON botanica_analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON botanica_analytics_events(user_id);
CREATE INDEX idx_analytics_events_timestamp ON botanica_analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session ON botanica_analytics_events(session_id);

-- RLS: Solo insert, nessun read diretto (usare RPC/Edge Functions)
ALTER TABLE botanica_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON botanica_analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- View aggregata per dashboard
CREATE VIEW analytics_daily_summary AS
SELECT 
  date_trunc('day', timestamp) as day,
  event_name,
  platform,
  count(*) as event_count,
  count(distinct user_id) as unique_users,
  count(distinct session_id) as unique_sessions
FROM botanica_analytics_events
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2;
```

---

## 📈 Metriche Chiave (KPIs)

### Onboarding Funnel

```
Avvio App → Onboarding Start → Onboarding Complete → First Plant Added
   100%          95%               80%                    60%
```

**Target Beta:**
- Onboarding completion: >75%
- First plant added: >50% degli utenti

### Engagement

| Metrica | Definizione | Target Beta |
|---------|-------------|-------------|
| DAU/MAU | Daily Active / Monthly Active | >20% |
| Avg Session Duration | Tempo medio per sessione | >3 min |
| Avg Plants per User | Piante aggiunte per utente | >3 |
| Task Completion Rate | % task completati vs mostrati | >40% |
| Chat Messages / User | Messaggi inviati per utente | >2 |

### Retention

| Metrica | Definizione | Target Beta |
|---------|-------------|-------------|
| D1 Retention | Tornano dopo 1 giorno | >40% |
| D7 Retention | Tornano dopo 7 giorni | >25% |
| D30 Retention | Tornano dopo 30 giorni | >15% |

---

## 🎯 Azioni Implementative

### Phase 1: Setup Base (Questa settimana)
- [ ] Creare migration SQL `006_analytics_events.sql`
- [ ] Creare `analyticsService.ts` con metodi base
- [ ] Tracciare eventi critici: `session_start`, `screen_view`, `plant_identified`

### Phase 2: Onboarding Tracking (Settimana prossima)
- [ ] Implementare tracking onboarding flow
- [ ] Aggiungere `first_plant_added` event
- [ ] Setup funnel visualizzazione

### Phase 3: Feature Tracking (Post-beta)
- [ ] Tracciare tutti gli eventi core
- [ ] Implementare retry offline
- [ ] Dashboard analytics interna

---

## 🔒 Privacy & GDPR

- **Dati raccolti:** Solo eventi di utilizzo, nessun dato personale sensibile
- **Opt-out:** Possibilità di disabilitare tracking nelle impostazioni
- **Retention:** Dati analytics conservati per 90 giorni (poi aggregati)
- **Cookie:** Nessun cookie di terze parti, solo first-party analytics

---

## 📋 Dashboard Query Utili

### Funnel Onboarding
```sql
SELECT 
  event_name,
  count(distinct session_id) as unique_sessions,
  count(*) as total_events
FROM botanica_analytics_events
WHERE event_name LIKE 'onboarding%'
  AND timestamp >= now() - interval '7 days'
GROUP BY event_name
ORDER BY 
  CASE event_name
    WHEN 'onboarding_started' THEN 1
    WHEN 'onboarding_step_completed' THEN 2
    WHEN 'onboarding_completed' THEN 3
  END;
```

### Top Feature Usage
```sql
SELECT 
  event_name,
  count(*) as event_count,
  count(distinct user_id) as unique_users
FROM botanica_analytics_events
WHERE timestamp >= now() - interval '7 days'
  AND event_name IN ('plant_identified', 'note_added', 'task_completed', 'chat_message_sent')
GROUP BY event_name
ORDER BY event_count DESC;
```

---

*Documento preparato da Anica 🌱 — 2026-02-14*
