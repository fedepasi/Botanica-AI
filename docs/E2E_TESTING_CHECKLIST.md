# Botanica-AI — E2E Testing Checklist (Beta)

**Versione:** 1.0  
**Data:** 2026-02-13  
**Scopo:** Guida completa per il testing end-to-end dell'app prima del lancio beta

---

## 📱 Device Coverage

| Priority | Device | OS Version | Screen Size | Stato |
|----------|--------|------------|-------------|-------|
| P0 | iPhone 14/15 | iOS 17+ | 6.1" | ⬜ |
| P0 | Samsung Galaxy S23 | Android 14 | 6.1" | ⬜ |
| P1 | iPhone SE | iOS 17+ | 4.7" | ⬜ |
| P1 | Pixel 7 | Android 14 | 6.3" | ⬜ |
| P2 | iPad Air | iPadOS 17+ | 10.9" | ⬜ |

---

## 🔄 Flussi Critici da Testare

### 1. Onboarding & Primo Avvio

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 1.1 | Installa PWA da Safari/Chrome | Icona app appare in home | ⬜ |
| 1.2 | Apri app (primo avvio) | Schermata welcome visibile | ⬜ |
| 1.3 | Completa onboarding | Utente arriva a dashboard vuota | ⬜ |
| 1.4 | Verifica permessi notifiche | Dialog richiesta mostrato | ⬜ |

**Note specifiche:**
- Verificare che l'onboarding non si ripeta al secondo avvio
- Testare dismiss dell'onboarding (se possibile)

---

### 2. Aggiunta Pianta (Flusso Completo)

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 2.1 | Tap "+" in dashboard | Aperta schermata add plant | ⬜ |
| 2.2 | Scatta foto con camera | Preview visibile, quality OK | ⬜ |
| 2.3 | Oppure: carica da galleria | Immagine caricata correttamente | ⬜ |
| 2.4 | Attendi identificazione AI | Spinner visibile, poi risultato | ⬜ |
| 2.5 | Verifica risultato identificazione | Nome pianta corretto, confidenza >80% | ⬜ |
| 2.6 | Conferma aggiunta | Redirect a detail pianta | ⬜ |
| 2.7 | Verifica piano di cura generato | Piano visibile nella scheda | ⬜ |
| 2.8 | Torna alla dashboard | Pianta appare in lista | ⬜ |

**Test Data:**
- Pomodoro (facile, alta confidenza)
- Pianta sconosciuta/difficile (test fallback)
- Foto sfocata/poco illuminata (test error handling)

---

### 3. Homepage UX (Task Raggruppati)

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 3.1 | Apri homepage con multiple piante | Task raggruppati per categoria | ⬜ |
| 3.2 | Espandi accordion "Potatura" | Lista piante che necessitano potatura | ⬜ |
| 3.3 | Tap su pianta nell'accordion | Aperta scheda pianta con dettaglio | ⬜ |
| 3.4 | Completare un task | Task sparisce/segni come done | ⬜ |
| 3.5 | Verifica aggiornamento | Homepage refresh con stato aggiornato | ⬜ |

---

### 4. Diario Pianta (Cronologia)

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 4.1 | Apri scheda pianta | Tab "Diario" visibile | ⬜ |
| 4.2 | Tap "Aggiungi nota" | Aperta modal/form nota | ⬜ |
| 4.3 | Inserisci testo nota | Testo accettato | ⬜ |
| 4.4 | Seleziona data passata | Data modificabile (es. 2 giorni fa) | ⬜ |
| 4.5 | Seleziona categoria | Dropdown categorie funzionante | ⬜ |
| 4.6 | Salva nota | Nota appare in cronologia | ⬜ |
| 4.7 | Verifica ordinamento | Note ordinate per data (recente prima) | ⬜ |
| 4.8 | Pin una nota | Nota pinned in cima | ⬜ |
| 4.9 | Aggiungi foto alla nota | Upload funzionante | ⬜ |

---

### 5. Chat con AI

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 5.1 | Apri chat dal menu | Chat screen caricata | ⬜ |
| 5.2 | Invia messaggio testo | Risposta AI entro 5 secondi | ⬜ |
| 5.3 | Carica foto in chat | Preview visibile, invio possibile | ⬜ |
| 5.4 | Scatta foto diretta in chat | Camera access + preview | ⬜ |
| 5.5 | Chiedi identificazione pianta | AI riconosce e suggerisce aggiunta | ⬜ |
| 5.6 | Chiedi consiglio cura | Risposta pertinente alla pianta | ⬜ |
| 5.7 | Verifica storico chat | Messaggi precedenti persistenti | ⬜ |

---

### 6. Cache Piano di Cura

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 6.1 | Apri pianta con piano esistente | Piano caricato istantaneamente (cache) | ⬜ |
| 6.2 | Verifica timestamp | "Generato il XX/XX/XXXX" visibile | ⬜ |
| 6.3 | Tap "Rigenera piano" | Nuova chiamata Gemini, piano aggiornato | ⬜ |
| 6.4 | Aggiungi nota alla pianta | Trigger rigenerazione automatica | ⬜ |

---

### 7. PWA & Offline

| Step | Azione | Risultato Atteso | Stato |
|------|--------|------------------|-------|
| 7.1 | Verifica installazione PWA | "Add to Home Screen" funziona | ⬜ |
| 7.2 | Apri da icona home | Splash screen, fullscreen mode | ⬜ |
| 7.3 | Test offline mode | Messaggio " offline" mostrato | ⬜ |
| 7.4 | Riabilita connessione | App si sincronizza automaticamente | ⬜ |
| 7.5 | Test background refresh | Dati aggiornati al riapertura | ⬜ |

---

### 8. Performance & UX

| Metrica | Target | Tool | Stato |
|---------|--------|------|-------|
| First Contentful Paint | < 1.5s | Lighthouse | ⬜ |
| Time to Interactive | < 3.5s | Lighthouse | ⬜ |
| Bundle Size | < 500KB | Build | ⬜ |
| Image Upload (1MB) | < 5s | Stopwatch | ⬜ |
| AI Response | < 5s | Stopwatch | ⬜ |
| Smooth scrolling | 60fps | DevTools | ⬜ |

---

## 🐛 Bug Tracking

| ID | Descrizione | Severità | Device | Passo per Replicare | Stato |
|----|-------------|----------|--------|---------------------|-------|
| | | | | | |

---

## ✅ Sign-off

| Ruolo | Nome | Data | Firma |
|-------|------|------|-------|
| QA Lead | | | ⬜ |
| Product Owner | Federico | | ⬜ |
| Dev Lead | | | ⬜ |

---

## 📝 Note Testing

- Testare con connessione lenta (3G throttling in DevTools)
- Testare con foto grandi (>5MB) per verificare resize
- Testare rotazione schermo durante operazioni
- Testare con Dark Mode attivo
- Testare con font size aumentato (accessibility)
