# Botanica-AI — Objectives & Roadmap

**Project:** Botanica-AI  
**Caretaker:** Anica 🌱  
**Current Phase:** DEVELOPMENT → GROWTH  
**Last Updated:** 2026-02-12

---

## 🎯 Visione

L'unico AI orticoltore personale — un'app che guida gli utenti nella cura del loro orto/frutteto con consigli proattivi basati su AI, meteo e cronologia delle lavorazioni.

---

## 📍 Current Phase: DEVELOPMENT

### Milestone Attuale: Core Feature Complete
**Target:** Completare le funzionalità core prima del lancio beta

**Stato:** 85% completato — attesa deploy e migrazioni da Federico

### Task Completati ( ultimi 7 giorni )
- ✅ Task #21: Piano di cura strutturato JSON — DONE
- ✅ Task #22: Refactoring homepage UX — DONE (design doc pronto)
- ✅ Task #23: Sistema cronologia e note per pianta — DONE
- ✅ Task #24: Cache piano di cura + rigenerazione smart — DONE
- ✅ Task #17: Fix API Key Exposure (Edge Functions Gemini) — DONE
- ✅ Task #16: Fix XSS (DOMPurify) — DONE

### Task in Attesa (bloccati da Federico)
- ⏸️ Task #30: Eseguire migrazioni SQL 004 + 005 — BACKLOG
- ⏸️ Task #31: Deploy Edge Functions Supabase — BACKLOG
- ⏸️ Task #18: Pitch Orto da Coltivare — REVIEW (attende approvazione)

---

## 🚀 Prossima Milestone: Beta Launch Prep

**Obiettivo:** Preparare l'app per il primo rilascio beta con utenti reali

### Checklist Pre-Beta
- [ ] Migrazioni SQL eseguite su Supabase (004_plant_notes_diary.sql, 005_care_plan_cache.sql)
- [ ] Edge Functions deployate (gemini, careplan-cache)
- [ ] Homepage UX refactoring implementato (Task #22)
- [ ] Test E2E su mobile (PWA)
- [ ] Setup analytics (Supabase + event tracking)
- [ ] Partnership ODC: pitch inviato e call fatta

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

1. **Documentazione:** Completare README tecnico per Federico (deploy checklist)
2. **Testing:** Verificare build locale post-commit
3. **Design:** Preparare mockups Task #22 per implementazione
4. **Marketing:** Bozze contenuti social per lancio beta

---

## 📝 Note

- App tecnicamente pronta per migrazioni/deploy — solo necessarie credenziali/approvazioni
- Edge function Gemini funzionante (testata in dev)
- Cache care plan implementata (frontend + service pronti)
- Homepage UX refactoring: design completo, attesa implementazione

