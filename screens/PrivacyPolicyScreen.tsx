import React, { useState, useEffect } from 'react';

type Lang = 'it' | 'en';

const content: Record<Lang, {
  title: string;
  subtitle: string;
  back: string;
  lastUpdated: string;
  sections: { title: string; body: string }[];
}> = {
  it: {
    title: 'Privacy Policy',
    subtitle: 'Botanica-AI',
    back: '← Torna all\'app',
    lastUpdated: 'Ultimo aggiornamento: Marzo 2026',
    sections: [
      {
        title: '1. Chi siamo',
        body: 'Botanica-AI è un\'app sviluppata da Federico Pasinetti (fede.pasi@gmail.com). Versione attuale: Beta. L\'app aiuta gli orticoltori e frutticoltori amatoriali a gestire il proprio orto con il supporto dell\'intelligenza artificiale.',
      },
      {
        title: '2. Dati raccolti',
        body: 'Raccogliamo i seguenti dati: indirizzo email (per l\'accesso), piante aggiunte al tuo giardino, foto caricate, messaggi inviati in chat con l\'AI, e task completati. Non raccogliamo dati di pagamento. Non vendiamo i tuoi dati a terze parti.',
      },
      {
        title: '3. Uso dell\'AI',
        body: 'Le foto e i messaggi che invii vengono trasmessi a Google Gemini AI per l\'elaborazione e per fornirti risposte personalizzate. Google applica la propria privacy policy. Noi non utilizziamo questi dati per addestrare modelli propri.',
      },
      {
        title: '4. Dove sono i tuoi dati',
        body: 'I tuoi dati sono archiviati su Supabase (EU-West, Frankfurt, Germania). Puoi richiedere l\'esportazione o la cancellazione completa dei tuoi dati in qualsiasi momento scrivendo a fede.pasi@gmail.com.',
      },
      {
        title: '5. Cookie e analytics',
        body: 'Utilizziamo Plausible Analytics, una soluzione privacy-first che non utilizza cookie di tracciamento e non raccoglie dati personali. Non è necessario alcun banner cookie. Non utilizziamo Google Analytics, Facebook Pixel o altri strumenti di tracciamento invasivi.',
      },
      {
        title: '6. I tuoi diritti (GDPR)',
        body: 'Ai sensi del GDPR hai diritto di accesso, rettifica, cancellazione e portabilità dei tuoi dati. Puoi esercitare questi diritti in qualsiasi momento scrivendo a fede.pasi@gmail.com. Risponderemo entro 30 giorni.',
      },
      {
        title: '7. Contatto',
        body: 'Per qualsiasi domanda o richiesta relativa alla privacy: Federico Pasinetti — fede.pasi@gmail.com',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Botanica-AI',
    back: '← Back to app',
    lastUpdated: 'Last updated: March 2026',
    sections: [
      {
        title: '1. Who we are',
        body: 'Botanica-AI is an app developed by Federico Pasinetti (fede.pasi@gmail.com). Current version: Beta. The app helps amateur gardeners and fruit growers manage their garden with AI support.',
      },
      {
        title: '2. Data we collect',
        body: 'We collect the following data: email address (for login), plants added to your garden, uploaded photos, messages sent in the AI chat, and completed tasks. We do not collect payment data. We do not sell your data to third parties.',
      },
      {
        title: '3. Use of AI',
        body: 'The photos and messages you send are transmitted to Google Gemini AI for processing and to provide you with personalized responses. Google applies its own privacy policy. We do not use this data to train our own models.',
      },
      {
        title: '4. Where your data lives',
        body: 'Your data is stored on Supabase (EU-West, Frankfurt, Germany). You can request export or complete deletion of your data at any time by writing to fede.pasi@gmail.com.',
      },
      {
        title: '5. Cookies and analytics',
        body: 'We use Plausible Analytics, a privacy-first solution that does not use tracking cookies and collects no personal data. No cookie banner is needed. We do not use Google Analytics, Facebook Pixel, or any other invasive tracking tools.',
      },
      {
        title: '6. Your rights (GDPR)',
        body: 'Under the GDPR you have the right to access, rectify, erase, and port your data. You can exercise these rights at any time by writing to fede.pasi@gmail.com. We will respond within 30 days.',
      },
      {
        title: '7. Contact',
        body: 'For any privacy-related questions or requests: Federico Pasinetti — fede.pasi@gmail.com',
      },
    ],
  },
};

export const PrivacyPolicyScreen: React.FC = () => {
  const [lang, setLang] = useState<Lang>('it');

  useEffect(() => {
    const stored = localStorage.getItem('botanica_language');
    if (stored === 'en') setLang('en');
    else setLang('it');
  }, []);

  const c = content[lang];

  return (
    <div className="min-h-screen bg-garden-beige font-outfit">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="text-sm font-semibold text-garden-green hover:text-garden-green/70 transition-colors"
          >
            {c.back}
          </button>
          <button
            onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-garden-green transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-garden-green"
          >
            {lang === 'it' ? 'EN' : 'IT'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center">
          <div className="w-16 h-16 bg-garden-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-garden-green/20">
            <i className="fa-solid fa-leaf text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{c.title}</h1>
          <p className="text-garden-green font-bold mt-1">{c.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {c.sections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <h2 className="text-base font-black text-garden-green mb-3 uppercase tracking-wide">
              {section.title}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {section.body}
            </p>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center pt-4 pb-10">
          <p className="text-xs text-gray-400">{c.lastUpdated}</p>
          <p className="text-xs text-gray-400 mt-1">
            <a href="mailto:fede.pasi@gmail.com" className="hover:text-garden-green transition-colors">
              fede.pasi@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
