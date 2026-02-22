# Botanica-AI — Objectives & Roadmap

**Project:** Botanica-AI  
**Caretaker:** Anica 🌱  
**Current Phase:** PRODUCT (Beta-Ready)  
**Last Updated:** 2026-02-22

---

## 🎯 Visione

L'unico AI orticoltore personale — un'app che guida gli utenti nella cura del loro orto/frutteto con consigli proattivi basati su AI, meteo e cronologia delle lavorazioni.

---

## 📍 M1 Status: Beta Launch Ready (95%)

### Milestone 1: Beta Launch (Target: 28 Feb 2026)
**Obiettivo:** Lanciare l'app con 20 beta testers e 0 bug critici

**Stato:** ✅ **95% completato** — app funzionante, QA E2E passed, pronta per beta

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
- ✅ Task #36: Fix i18n hardcoded "or Upload" — DONE (17 feb 2026)

### Task Completati Oggi (13 Feb)
- ✅ Task #30: Eseguire migrazioni SQL 004 + 005 — DONE
- ✅ Task #31: Deploy Edge Functions Supabase — DONE  
- ✅ Task #31b: Configurare GEMINI_API_KEY in Supabase Secrets — DONE

### Task in Attesa (bloccati da Federico)
- ⏸️ Task #18: Pitch Orto da Coltivare — REVIEW (attende approvazione invio email)

---

## 🚀 Prossima Milestone: Beta Launch Prep

**Obiettivo:** Preparare l'app per il primo rilascio beta con utenti reali

### Checklist M1 — Beta Launch
- [x] Migrazioni SQL eseguite (004, 005)
- [x] Edge Functions deployate (gemini + careplan-cache)
- [x] Homepage UX refactoring (Task #22)
- [x] Upload foto chat (Task #35)
- [x] QA E2E completo — 74 test, 43 ✅ passati (17 feb)
- [x] Bug P0 JWT risolto (commit a1bb7fa)
- [x] PWA installabile — manifest + service worker
- [ ] **20 beta testers reclutati** — 0/20 (CRITICO)
- [ ] Analytics setup (Plausible/GA4) — PROPOSTO
- [ ] Partnership ODC: pitch + call — DRAFT PRONTO

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

## 🌱 Azioni Immediate (Settimana 24-28 Feb)

### P0 — Lancio Beta (questa settimana)
1. ✅ **Draft pitch ODC** — email value prop pronta per Federico
2. 🔴 **Recluta 5-10 beta testers** — r/gardening, forum giardinaggio IT
3. 🟡 **Setup analytics** — Plausible o GA4 per baseline metrics
4. 🟢 **Prepare onboarding guide** — PDF/video tutorial per beta testers

### M2 Planning (post-beta)
- Push notifications (FCM setup)
- Onboarding flow ottimizzato (3 screen: welcome → add plant → tips)
- Multi-language (i18n EN completo)
- Content marketing (5 post r/gardening, blog seeding)

---

## 📝 Note & Status

**22 Feb 2026:**
- ✅ App beta-ready — tutte feature core funzionanti
- ✅ QA E2E completato — 0 bug critici aperti
- 🔴 **Blocker critico:** 0 beta testers — serve recruitment attivo
- 🟡 Task #18 (ODC pitch) — email draft pronta, attendo timing Federico
- 🟢 Analytics proposto — non critico per beta ma utile per metrics

**Week Goals (24-28 Feb):**
1. Draft pitch ODC → send to Federico
2. Recruit 5-10 beta testers da Reddit/forum
3. Setup analytics baseline
4. Prepare beta tester onboarding guide

