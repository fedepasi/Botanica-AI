# MEMORY.md - Long-Term Memory

## Stato Progetto (2026-04-13) — FREEZE CONFERMATO

**Decisione Federico (29 Marzo 2026):** Congelare fino a settembre/ottobre 2026.
**Motivo:** Finestra primaverile chiusa senza outreach. Prossima finestra: preparazione stagione autunnale 2026 → lancio beta primavera 2027.

**Stato al momento del freeze:**
- App: 100% pronta, 0 bug critici, deploy live su Vercel
- Beta tester: 0/20 (M1 non raggiunta per mancato outreach)
- Ultimi commit: d8825a5 (rolling careplan proposal), 2a2bef0 (deps update + one-pager)
- Docs pronti per ripartenza: COMMUNITY_OUTREACH_NO_SOCIAL.md, BETA_LAUNCH_KIT.md, ODC_PITCH_DRAFT.md, ONBOARDING_GUIDE_BETA.md, marketing/content-beta-launch.md
- Proposta tecnica rolling care plan: docs/rolling-careplan-proposal.md (da implementare in M2)
- HEARTBEAT.md: vuoto (freeze attivo)

**Quando ripartire (settembre 2026):**
1. Leggere questo MEMORY.md + OBJECTIVES.md
2. git pull — app pronta in 24h
3. Implementare rolling care plan (docs/rolling-careplan-proposal.md) PRIMA di outreach
4. Eseguire 5 azioni outreach (docs/COMMUNITY_OUTREACH_NO_SOCIAL.md)
5. Contattare ODC — timing perfetto per pre-stagione autunnale

**Note tecniche da ricordare al riavvio:**
- Vulnerabilità vite-plugin-pwa/workbox (build-time, non runtime) — fixare in M2 con downgrade 0.19.x
- ErrorBoundary TS errors in App.tsx — pre-esistenti, non bloccanti
- GEMINI_API_KEY configurata in Supabase Secrets

## Stato Progetto (2026-03-15) — PAUSA STRATEGICA
[vedi sopra per storico]

## Stato Progetto (2026-02-11)
- **Repo:** github.com/fedepasi/Botanica-AI
- **Stack:** React + Vite + TypeScript + Supabase + i18n
- **Positioning:** L'unico AI orticoltore personale
- **Target:** Orticoltori e frutticoltori amatoriali
- **Partnership potenziale:** Orto da Coltivare (250k community)
- **Deploy:** Vercel
- **Stato:** App funzionante, SEO ottimizzata, i18n completo

## Fase Attuale: PRODOTTO (non marketing)
Federico ha chiarito: ora la priorità NON è SEO. Siamo in fase prodotto — dobbiamo avere un'app solida prima di promuoverla, specialmente se ci uniamo a ODC (250k utenti).

## Priorità (da Federico)
1. **Funzionalità** — l'app fa tutto quello che deve? Cosa manca?
2. **Usabilità** — è intuitiva? Un orticoltore amatoriale la usa senza problemi?
3. **Bug hunting** — testare tutto, trovare e fixare bug
4. **Analisi utenti** — cosa chiedono gli orticoltori sui forum? Quali feature vogliono?
5. **PWA** — installabile, veloce, offline-capable
6. SEO viene DOPO, quando il prodotto è solido

## Decisioni
- Botanica-AI è repo separato, caretaker autonomo
- Non usare troppo "bot" — Anica è la voce e anima della scienza
- Competitor analysis: Blossom (12.9M), Gardenize, GRŌ, Growbot — tutti generici, nessuno focalizzato su orto/frutteto specifico

## Fix Completati
- [2026-02-11] Bug i18n `t('online')` risolto
- [2026-02-11] SEO on-page: meta tags, Open Graph, Twitter Cards
- [2026-02-11] Structured data JSON-LD (Schema.org SoftwareApplication)
- [2026-02-11] Manifest.json ottimizzato
- [2026-02-11] PWA: vite.config.ts usa manifest.json esterno
- [2026-02-11] i18n: aggiunti `changePhoto`, `email`, `signOut`
- [2026-02-11] Fix: `updatePlantNotes` ora funziona (era stub)

## User Research Insights
**Da Reddit r/gardening:**
- Utenti vogliono free trial prima di pagare
- Weather-aware watering è must-have
- Companion planting info molto richiesta
- Zone-based planting calendar importante
- Critica competitor: "generic plant types, not specific varieties" → Noi siamo avanti con varietà specifiche

## Idee Strategiche (Pending)
- Content SEO: landing pages per piante specifiche
- Partnership Orto da Coltivare (250k utenti)
- Freemium model
- Blog AI-generated stagionale

## Task P0 da Federico (COMPLETATI)
- #21: Piano di cura JSON strutturato — ✅ **COMPLETATO**
- #22: Refactoring homepage UX — ✅ **COMPLETATO**
- #23: Diario della pianta — ✅ **COMPLETATO**
- #24: Cache piano di cura + rigenerazione smart — ✅ **COMPLETATO**
- #30: Migrazioni SQL Supabase — ✅ **COMPLETATO**
- #31: Deploy Edge Functions — ✅ **COMPLETATO**

## ✅ Blocker Risolto
- ~~#31b: Configurare GEMINI_API_KEY~~ — ✅ Completato da Federico
- ~~Fix edge function URL~~ — ✅ Pushato (commit 07c1fd0)

## 🆕 Nuovi Task (Post-Beta)
- **#35: Upload/Capture Foto in Chat** — Proposta pronta, in attesa OK

## Status Deploy Pre-Beta
- Build: ✅ OK (496KB bundle, PWA OK)
- Migrazioni: ✅ Eseguite
- Edge Functions: ✅ Deployate
- API Key: ✅ Configurata (GEMINI_API_KEY)
- Test E2E: ⏸️ Parziale (5/10 test PASS, browser timeout)
- Vercel Deploy: ✅ LIVE (https://botanica-ai.vercel.app)
- **Status:** App funzionante, 0 bug critici, blocker = 0/20 beta testers

## Weekly QA (2026-02-24)
- **Test completati:** 5/10 (Home, My Garden, Add Plant, Ricerca Rosmarino)
- **Bug critici:** 0
- **UX issues:** Nessuno nei test completati
- **Competitor analysis:** Blossom (problemi photo ID), Gardenize (no AI), VegPlotter (nuovo 2026, no AI)
- **Strategic insight:** Positioning unico (AI + orto/frutteto specifico)
