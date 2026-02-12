# Botanica-AI — Beta Testing Guide

**Versione:** 1.0  
**Data:** 2026-02-12  
**Preparato da:** Anica 🌱

---

## 🎯 Scopo di questo documento

Guida step-by-step per testare tutte le funzionalità di Botanica-AI dopo il deploy beta. Eseguire questi test prima di condividere l'app con utenti esterni.

---

## ✅ Pre-requisiti

- [ ] Migrazioni SQL 004 + 005 eseguite
- [ ] Edge Functions deployate
- [ ] App deployata su Vercel (o localhost)
- [ ] Account di test creato

---

## 🧪 Test Suite

### Test 1: Onboarding Flow
**Percorso:** Accesso → Registrazione → Primo utilizzo

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 1.1 | Apri app in incognito | Redirect a /login | ☐ |
| 1.2 | Clicca "Crea account" | Form registrazione visibile | ☐ |
| 1.3 | Compila form valido | Account creato, redirect a /garden | ☐ |
| 1.4 | Clicca "Aggiungi prima pianta" | Modal apertura foto | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 2: Identificazione Pianta (AI)
**Percorso:** Aggiungi pianta → Foto → Identificazione

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 2.1 | Scatta/Upload foto chiara | Upload completato | ☐ |
| 2.2 | Attendi identificazione | Nome pianta mostrato con confidenza | ☐ |
| 2.3 | Verifica risultato | Nome corretto o vicino (es. "Melo" vs "Malus domestica") | ☐ |
| 2.4 | Modifica nome se necessario | Campo editabile, salva OK | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 3: Piano di Cura (Cache)
**Percorso:** Pianta → Piano di cura → Rigenerazione

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 3.1 | Apri scheda pianta | Piano di cura visibile (formato JSON strutturato) | ☐ |
| 3.2 | Verifica struttura | Sezioni: watering, sunlight, soil, fertilizing, pruning, temperature, pests, repotting, harvesting, warnings, tips | ☐ |
| 3.3 | Cronometra caricamento | Prima generazione: ~3-5s | ☐ |
| 3.4 | Torna indietro, riapri stessa pianta | Caricamento: <1s (da cache) | ☐ |
| 3.5 | Clicca "Rigenera piano" | Nuovo piano generato, timestamp aggiornato | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 4: Diario Piante (Plant Notes)
**Percorso:** Pianta → Diario → Aggiungi nota

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 4.1 | Scrolla in basso su scheda pianta | Sezione "Diario" visibile | ☐ |
| 4.2 | Clicca "Aggiungi nota" | Form aperto | ☐ |
| 4.3 | Scrivi nota: "Piantato oggi" | Testo accettato | ☐ |
| 4.4 | Seleziona data: 2 giorni fa | Data visualizzata correttamente | ☐ |
| 4.5 | Seleziona categoria: "Planting" | Categoria salvata | ☐ |
| 4.6 | Aggiungi tag: "primavera" | Tag salvato | ☐ |
| 4.7 | Salva nota | Nota appare in lista, ordinata per data | ☐ |
| 4.8 | Clicca "Pin" su nota | Nota in cima, icona pin visibile | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 5: Task / Homepage
**Percorso:** Homepage → Task giornalieri

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 5.1 | Vai a /garden (homepage) | Lista task visibile | ☐ |
| 5.2 | Verifica raggruppamento | Task raggruppati per: Overdue, Today, This Week | ☐ |
| 5.3 | Spunta un task come completato | Task scompare/sposta a completati | ☐ |
| 5.4 | Verifica molte piante (>10) | Scroll gestibile, nessun sovrapposizione bottoni | ☐ |

**Note:** Task #22 (UX refactoring) migliorerà questa sezione. Per ora verificare che funzioni.

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 6: PWA (Mobile)
**Percorso:** Chrome mobile → Aggiungi a home

| Step | Azione | Risultato Atteso | ✓ |
|------|--------|------------------|---|
| 6.1 | Apri app su Chrome Android/iOS | Nessun errore console visibile | ☐ |
| 6.2 | Clicca "Aggiungi a schermata Home" | Prompt installazione PWA | ☐ |
| 6.3 | Installa app | Icona appare su home screen | ☐ |
| 6.4 | Apri da home screen | App in standalone mode (no barra browser) | ☐ |
| 6.5 | Verifica offline (airplane mode) | Toast "Offline mode" o pagina cache | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

### Test 7: Edge Cases

| Scenario | Azione | Risultato Atteso | ✓ |
|----------|--------|------------------|---|
| Foto sfocata | Upload foto non chiara | Messaggio "Foto non chiara, riprova" o identificazione bassa confidenza | ☐ |
| Pianta non riconosciuta | Foto di un oggetto non-pianta | Messaggio "Impossibile identificare" | ☐ |
| Connessione lenta | Throttle network a 3G | Loading states visibili, nessun freeze | ☐ |
| Sessione scaduta | Aspetta +1 ora, refresh | Redirect a login, dopo login torna a pagina precedente | ☐ |

**Issue tracking:**
- [ ] Step fallito: ___
- [ ] Note: ___

---

## 📊 Checklist Finale Pre-Beta

- [ ] Tutti i test sopra eseguiti
- [ ] Nessun errore critico (bloccante)
- [ ] Issue minori documentati
- [ ] Performance accettabile (<3s caricamento)
- [ ] Mobile OK (iPhone SE / Android base)

---

## 🐛 Template Segnalazione Bug

```
**Test:** # (numero test)
**Step:** # (numero step)
**Dispositivo:** (es. iPhone 14 / Chrome Desktop)
**Comportamento atteso:** 
**Comportamento attuale:**
**Screenshot:** (se possibile)
**Console errors:** (se visibili)
```

---

## 🚀 Post-Test

Se tutti i test passano:
1. ✅ App pronta per utenti beta
2. Invita 5-10 utenti di fiducia
3. Raccogli feedback con form semplice

---

*Documento preparato da Anica 🌱 per il team Botanica-AI*
