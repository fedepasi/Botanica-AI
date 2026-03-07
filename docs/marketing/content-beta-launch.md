# Botanica-AI — Contenuti Marketing Beta Launch
*Autore: Federico Pasinetti | Data: Marzo 2026*

---

# LINKEDIN POST 1 — Pain Point

Mio nonno aveva un quaderno. Ci segnava tutto.

Quando annaffiare i pomodori. Quando concimare le zucchine. Quando raccogliere le cipolle. Quarant'anni di orto condensati in 200 pagine di scrittura a mano, macchiate di terra.

Io quel quaderno non ce l'ho.

E ogni estate mi ritrovo a fare la stessa cosa: cercare su Google "quando annaffiare i pomodori", leggere 5 articoli diversi con 5 risposte diverse, e alla fine fare una scelta a caso sperando che vada bene.

Spoiler: non va sempre bene.

Ho perso un intero raccolto di basilico perché annaffiavo troppo. Ho visto i miei pomodori spezzarsi per colpa della siccità mentre ero in vacanza. Ho comprato fertilizzante sbagliato su consiglio di un articolo scritto per chi abita in Toscana, quando io vivo in Lombardia.

Il problema non è che siamo ignoranti. Il problema è che i consigli generici non funzionano per un orto specifico, in una zona specifica, in un momento specifico dell'anno.

Voi come fate? Avete ancora quel quaderno?

#orto #giardinaggio #orticoltori

---

# LINKEDIN POST 2 — App + Screenshot

Per anni ho indovinato. Quest'estate ho smesso.

Il momento di svolta: mi trovavo davanti al mio pomodoro San Marzano con le foglie che si arricciavano. Carenza di acqua? Troppa acqua? Un fungo? Ho passato 40 minuti su forum e gruppi Facebook senza una risposta chiara.

Così ho costruito qualcosa di diverso.

Ho fotografato la pianta. L'app l'ha identificata in secondi — varietà, stadio di crescita, problemi visibili. Poi mi ha generato un piano di cura personalizzato: non "annaffia 2 volte a settimana", ma "per un San Marzano in vaso da 30cm, a luglio, in zona padana, annaffia ogni mattina presto con 500ml".

Quando ho ancora dubbi, chiedo ad Anica — la chat AI dell'app — e mi risponde come se conoscesse il mio orto da anni.

Tre funzioni concrete:
→ Identificazione pianta da foto
→ Piano di cura personalizzato sulla tua varietà, zona e stagione
→ Chat AI disponibile sempre, anche alle 11 di sera quando le foglie si accasciano

È in beta aperta, gratuita. Se hai un orto o un balcone con piante, puoi provarlo adesso.

botanica-ai.vercel.app

#giardinaggio #orto #AI

---

# LINKEDIN POST 3 — Behind the Scenes

Ho impiegato 3 mesi a costruire questo. E ho sbagliato quasi tutto, almeno una volta.

Sono uno sviluppatore. So scrivere codice. Ma far funzionare un sistema di AI in modo affidabile per persone reali — persone che non vogliono capire come funziona, vogliono solo sapere quando annaffiare — è un'altra cosa.

**La prima sfida:** l'autenticazione.

Ogni volta che un utente apriva l'app dopo un'ora, l'AI smetteva di rispondere. Il problema erano i token di accesso — una specie di chiave temporanea che scade e deve essere rinnovata automaticamente. Sembrava risolto. Poi smetteva di funzionare su Safari. Poi su Chrome mobile. Tre settimane per sistemarlo correttamente.

**La seconda sfida:** far capire all'AI il contesto dell'utente.

L'intelligenza artificiale è bravissima a dare consigli generici. Insegnarle a ragionare in modo specifico — "questo utente ha un basilico in un vaso piccolo, sul balcone, a Milano, ad agosto" — ha richiesto settimane di test, errori, e riscritture.

**La terza sfida:** la semplicità.

Ho costruito funzioni complesse che ho poi eliminato perché confondevano. Se una persona di 60 anni con un orto non capisce come usarlo in 2 minuti, ho fallito io, non lei.

Cosa ho imparato come sviluppatore: la parte difficile non è il codice. È capire davvero il problema delle persone a cui stai costruendo qualcosa.

Cosa ho imparato come persona: ho ricominciato a guardare l'orto con occhi diversi. Non come un progetto tecnico. Come qualcosa che vale la pena curare bene.

Se sei curioso di vedere dove siamo arrivati: botanica-ai.vercel.app (beta gratuita)

#giardinaggio #sviluppo #AI #orto

---

# BLOG POST — Perché ho creato un AI orticoltore personale

## Il quaderno di mio nonno

Mio nonno aveva un quaderno a quadretti, copertina verde, tenuto in un cassetto vicino alla porta del giardino. Ci segnava tutto: quando aveva piantato i peperoni, quando aveva concimato le zucchine, quando i pomodori avevano iniziato a fare i problemi con i parassiti e cosa aveva usato per risolverlo.

Quarant'anni di orto in 200 pagine macchiate di terra.

Io quel quaderno non ce l'ho. E ogni estate mi ritrovo ad annaffiare a caso, sperando di indovinare.

---

## Il problema vero di chi ha un orto

Se cerchi "quando annaffiare i pomodori" su Google, trovi decine di articoli. Tutti dicono cose diverse. Alcuni dicono due volte a settimana. Altri ogni giorno. Altri dipende.

Dipende da cosa? Dal tipo di terreno. Dal vaso o dalla piena terra. Dal mese. Dalla zona d'Italia. Dalla varietà. Dal caldo di quest'anno specifico.

I consigli generici non funzionano per un orto specifico.

"Annaffia 2 volte a settimana" — ma quale settimana? Quella di agosto con 38 gradi o quella di giugno con la pioggia ogni tre giorni? In Sicilia o in Piemonte? In un vaso sul balcone o in piena terra?

Ho visto persone perdere interi raccolti seguendo consigli corretti — ma scritti per una situazione completamente diversa dalla loro. Ho fatto io stesso la stessa cosa, più volte.

Il problema non è la mancanza di informazioni. È che le informazioni disponibili non sono mai abbastanza specifiche per essere davvero utili.

---

## Perché l'AI può cambiare qualcosa

Quando ho iniziato a pensare a questo progetto, la domanda che mi facevo era: può un'intelligenza artificiale capire il mio orto specifico?

Non l'orto in generale. Il mio basilico. In quel vaso da 20 centimetri. Sul balcone a Milano. Ad agosto.

La risposta, dopo mesi di lavoro, è sì — ma solo se costruisci il sistema nel modo giusto.

L'AI di cui parlo non inventa conoscenza botanica dal nulla. Usa Gemini, il modello di Google, che ha assorbito una quantità enorme di informazioni su piante, coltivazione, malattie, tecniche. Ma la differenza sta nel contesto: invece di chiedere "come curo i pomodori?", il sistema chiede "come curo questo pomodoro San Marzano, in vaso, a luglio, in zona padana, con questo problema specifico che vedo dalla foto?"

Non sostituisce l'esperienza di mio nonno. Non può farlo. Ma può amplificare la tua esperienza — qualunque essa sia — e colmare i vuoti con precisione, non con approssimazioni.

È come avere accesso a qualcuno che ha letto tutti i libri di agronomia e può applicarli alla tua situazione specifica, invece di darti la risposta standard.

---

## Cosa fa concretamente l'app

Botanica-AI ha tre funzioni principali.

**Identificazione pianta da foto.** Fai una foto con il telefono, l'app analizza l'immagine e ti dice che pianta è, in che stato è, e se ci sono problemi visibili. Ho fotografato il mio pomodoro San Marzano con le foglie arricciate: in meno di un minuto sapevo che si trattava di stress idrico, non di una malattia.

**Piano di cura personalizzato.** Dopo l'identificazione, l'app genera un piano di cura che tiene conto della varietà specifica, del mese, della tua zona geografica, e del tipo di contenitore (vaso, piena terra, serra). Per il mio San Marzano ho ricevuto un piano di irrigazione con quantità precise, orari consigliati, e frequenza — non "2 volte a settimana" ma qualcosa di concreto e applicabile.

**Chat AI con Anica.** Anica è l'assistente dell'app — disponibile sempre, anche alle 11 di sera quando ti accorgi che qualcosa non va. Le puoi descrivere il problema con parole tue, mandarle una foto, chiederle cosa fare. Risponde con la conoscenza di un agronomo e la pazienza di chi non ti giudica se non sai il nome latino della malattia.

---

## Dove siamo adesso

L'app è in beta aperta. Gratuita. Chiunque può usarla adesso, senza aspettare, senza carte di credito.

Non è perfetta. Ci sono funzioni che devo migliorare, casi limite che non gestisce ancora bene, lingue che devo affinare. È un lavoro in corso — e per questo ho bisogno di persone reali che la usino e mi dicano cosa non va.

Se hai un orto. Un balcone con i pomodori. Qualche pianta sul davanzale che non sai come curare.

Prova. È gratis. Dimmi cosa pensi.

→ **botanica-ai.vercel.app**

---

## Una riflessione finale

Quando mio nonno segnava le cose sul quaderno, non stava raccogliendo dati. Stava costruendo una relazione con il suo pezzo di terra. Anno dopo anno, stagione dopo stagione.

La tecnologia che sto costruendo non sostituisce quella relazione. Non può farlo, e non voglio che lo faccia. Può aiutarti a iniziarla se sei agli inizi. Può supportarla se hai già esperienza. Può colmare i vuoti quando non sai cosa fare e mio nonno non è più qui a rispondere.

L'orto ti insegna la pazienza, il ciclo delle cose, il fatto che non puoi controllare tutto. L'AI ti aiuta a fare meglio le parti che puoi controllare.

Quello che cresce, alla fine, lo fai crescere tu.

---

*Federico Pasinetti — fondatore di Botanica-AI*
*Botanica-AI è disponibile in beta gratuita su [botanica-ai.vercel.app](https://botanica-ai.vercel.app)*
