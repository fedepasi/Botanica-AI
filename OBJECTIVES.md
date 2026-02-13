# Botanica-AI — Objectives & Roadmap

**Project:** Botanica-AI  
**Caretaker:** Anica 🌱  
**Current Phase:** DEVELOPMENT → GROWTH  
**Last Updated:** 2026-02-12

---

## 🎯 Visione

L'unico AI orticoltore personale — un'app che guida gli utenti nella cura del loro orto/frutteto con consigli proattivi basati su AI, meteo e cronologia delle lavorazioni.

---

## 📍 Current Phase: DEVELOPMENT → GROWTH

### Milestone Attuale: Beta Launch Prep
**Target:** Preparare l'app per il primo rilascio beta con utenti reali

**Stato:** 90% completato — funzionalità core pronte, mancano test e analytics

### Task Completati ( ultimi 7 giorni )
- ✅ Task #21: Piano di cura strutturato JSON — DONE
- ✅ Task #22: Refactoring homepage UX — DONE (implementato su main)
- ✅ Task #23: Sistema cronologia e note per pianta — DONE
- ✅ Task #24: Cache piano di cura + rigenerazione smart — DONE
- ✅ Task #17: Fix API Key Exposure (Edge Functions Gemini) — DONE
- ✅ Task #16: Fix XSS (DOMPurify) — DONE
- ✅ Task #30: Migrazioni SQL 004 + 005 — DONE (eseguite da Federico)
- ✅ Task #31: Deploy Edge Functions Supabase — DONE (deployate da Federico)
- ✅ Task #35: Upload/Capture Foto in Chat — DONE

### Task Completati Oggi (13 Feb)
- ✅ Task #30: Eseguire migrazioni SQL 004 + 005 — DONE
- ✅ Task #31: Deploy Edge Functions Supabase — DONE  
- ✅ Task #31b: Configurare GEMINI_API_KEY in Supabase Secrets — DONE

### Task in Attesa (bloccati da Federico)
- ⏸️ Task #18: Pitch Orto da Coltivare — REVIEW (attende approvazione invio email)

---

## 🚀 Prossima Milestone: Beta Launch Prep

**Obiettivo:** Preparare l'app per il primo rilascio beta con utenti reali

### Checklist Pre-Beta
- [x] Migrazioni SQL eseguite su Supabase (004_plant_notes_diary.sql, 005_care_plan_cache.sql)
- [x] Edge Functions deployate (gemini, careplan-cache)
- [x] Homepage UX refactoring implementato (Task #22)
- [ ] Test E2E su mobile (PWA) — IN PROGRESS
- [ ] Setup analytics (Supabase + event tracking) — TODO
- [ ] Partnership ODC: pitch inviato e call fatta — ATTESA FEDERICO

### Post-Beta (Phase: GROWTH)
- [ ] Onboarding flow ottimizzato
- [ ] Push notifications (promemoria lavorazioni)
- [ ] Multi-language (i18n completo EN)
- [ ] App Store / Play Store submission
- [ ] Content marketing (blog, social)

---

## 📊 Metriche Target

| Metrica | Target Beta | Target Growth |
|---------|-------------|---------------|
| Utenti attivi | 50 | 500 |
| Piante tracciate | 200 | 2,000 |
| Retention D7 | 40% | 50% |
| NPS | — | >40 |

---

## 🌱 Prossime Azioni (cosa posso fare oggi)

1. **Testing:** Creare E2E Testing Checklist per beta testing mobile — IN CORSO
2. **Analytics:** Setup tracking plan per eventi core (onboarding, plant add, task complete)
3. **Documentazione:** Aggiornare deploy checklist con post-deploy verification
4. **Marketing:** Bozze contenuti social per lancio beta

---

## 📝 Note

- ✅ Migrazioni SQL eseguite e Edge Functions deployate (13 feb 2026)
- ✅ Homepage UX refactoring implementato e su main
- ✅ Upload foto in chat completato con resize automatico
- ⏸️ Task #22 implementato, necessita test E2E su mobile
- ⏸️ Task #18 (pitch ODC) in attesa approvazione Federico per invio

