# Botanica-AI Analytics Tracking Plan

**Version:** 1.0  
**Created:** 2026-02-21  
**Status:** Ready for Beta Launch

---

## 🎯 Beta Launch Metrics

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| Utenti attivi | 50 | `user_signup` + `screen_view` |
| Piante tracciate | 200 | `plant_added` count |
| Retention D7 | 40% | `get_retention_metrics()` function |
| NPS | — | `beta_feedback_submitted` |

---

## 📊 Events Tracked

### 1. Onboarding & Authentication

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_signup` | After successful registration | `method` (email/google) |
| `user_login` | After successful login | `method` |
| `user_logout` | When user logs out | — |

### 2. Garden Management

| Event | Trigger | Properties |
|-------|---------|------------|
| `plant_added` | After plant creation | `plant_id`, `plant_name` |
| `plant_removed` | After plant deletion | `plant_id`, `plant_name` |
| `plant_viewed` | When opening plant detail | `plant_id`, `plant_name` |
| `plant_photo_changed` | After photo upload | `plant_id` |

### 3. Tasks

| Event | Trigger | Properties |
|-------|---------|------------|
| `task_completed` | When user marks task done | `task_id`, `task_name`, `plant_name` |
| `task_viewed` | When viewing task details | `task_id` |

### 4. Care Plan

| Event | Trigger | Properties |
|-------|---------|------------|
| `care_plan_viewed` | When viewing care plan | `plant_id`, `source` (cache/fresh) |
| `care_plan_regenerated` | When user clicks regenerate | `plant_id` |
| `care_plan_cache_used` | When cached plan is displayed | `plant_id`, `age_days` |

### 5. Chat AI

| Event | Trigger | Properties |
|-------|---------|------------|
| `chat_message_sent` | When user sends message | `has_photo` (boolean) |
| `chat_photo_uploaded` | When photo is attached | `file_size`, `mime_type` |
| `chat_response_received` | When AI responds | `response_length`, `response_time_ms` |

### 6. Notes

| Event | Trigger | Properties |
|-------|---------|------------|
| `note_added` | When note is created | `plant_id` |
| `note_saved` | When note is saved | `plant_id`, `note_length` |

### 7. Navigation

| Event | Trigger | Properties |
|-------|---------|------------|
| `screen_view` | On every screen change | `screen` (name) |
| `calendar_viewed` | When opening calendar | `month`, `year` |

### 8. Settings

| Event | Trigger | Properties |
|-------|---------|------------|
| `language_changed` | When user switches language | `from`, `to` |

### 9. Beta Specific

| Event | Trigger | Properties |
|-------|---------|------------|
| `beta_feedback_submitted` | When feedback form submitted | `rating`, `category` |

---

## 🔧 Implementation Guide

### Basic Usage

```typescript
import { trackEvent, trackScreenView, trackPlantAction } from './services/analyticsService';

// Track a custom event
trackEvent('plant_added', { plant_id: '123', plant_name: 'Rosmarino' });

// Track screen view
trackScreenView('PlantDetail', { plant_id: '123' });

// Track plant actions
trackPlantAction('viewed', plant.id, plant.name);
trackPlantAction('added', newPlant.id, newPlant.name);
```

### Integration Points

Add tracking to these key locations:

1. **App.tsx** - Initialize analytics on app start
2. **AuthScreen.tsx** - Track login/signup
3. **HomeScreen.tsx** - Track screen view, task completion
4. **GardenScreen.tsx** - Track plant views
5. **PlantDetailScreen.tsx** - Track care plan views, notes
6. **ChatScreen.tsx** - Track messages, photo uploads
7. **CalendarScreen.tsx** - Track calendar views
8. **ProfileScreen.tsx** - Track language changes

### Dashboard Queries

```sql
-- Daily active users
SELECT COUNT(DISTINCT user_id) 
FROM botanica_analytics 
WHERE timestamp >= CURRENT_DATE;

-- Total plants added this week
SELECT COUNT(*) 
FROM botanica_analytics 
WHERE event = 'plant_added' 
  AND timestamp >= NOW() - INTERVAL '7 days';

-- Retention metrics
SELECT * FROM get_retention_metrics('2026-02-01', CURRENT_DATE);
```

---

## 🚀 Deployment Checklist

- [x] Create analytics service (`services/analyticsService.ts`)
- [x] Create migration (`supabase/migrations/006_analytics_table.sql`)
- [ ] Run migration on Supabase
- [ ] Integrate tracking calls in screens
- [ ] Test events are being recorded
- [ ] Create dashboard view for metrics

---

## 📝 Notes

- Analytics uses existing Supabase connection
- Events are sent asynchronously (non-blocking)
- Failures are logged to console but don't break the app
- Session ID persists for the browser session
- RLS ensures users can only see their own events
