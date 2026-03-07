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
    title: 'Termini di Servizio',
    subtitle: 'Botanica-AI',
    back: '← Torna all\'app',
    lastUpdated: 'Ultimo aggiornamento: Marzo 2026',
    sections: [
      {
        title: '1. Versione Beta',
        body: 'Stai usando una versione beta non definitiva di Botanica-AI. Le funzionalità possono cambiare, essere rimosse o aggiunte senza preavviso. Non ci sono garanzie di continuità del servizio durante la fase beta.',
      },
      {
        title: '2. I tuoi dati sono tuoi',
        body: 'Le piante, le foto, le note e i piani di cura che crei su Botanica-AI sono di tua esclusiva proprietà. Puoi esportarli o cancellarli in qualsiasi momento scrivendo a fede.pasi@gmail.com.',
      },
      {
        title: '3. Uso dell\'AI',
        body: 'I consigli forniti dall\'intelligenza artificiale sono puramente informativi e non sostituiscono una consulenza agronomica professionale. L\'app non si assume alcuna responsabilità per risultati del raccolto, perdita di piante o danni derivanti dall\'uso delle indicazioni fornite.',
      },
      {
        title: '4. Gratuità Beta',
        body: 'Il servizio è completamente gratuito durante la fase beta. Ti avviseremo con adeguato anticipo se e quando introdurremo piani a pagamento o modifiche alla struttura del servizio.',
      },
      {
        title: '5. Comportamento',
        body: 'Non usare l\'app per caricare o diffondere contenuti illegali, offensivi, fuorvianti o che violino i diritti di terzi. Ci riserviamo il diritto di sospendere o disabilitare account in caso di abusi o violazioni.',
      },
      {
        title: '6. Limitazioni di responsabilità',
        body: 'Durante la beta possono verificarsi interruzioni di servizio, perdita di dati o comportamenti inattesi dell\'app. Facciamo del nostro meglio per minimizzare questi inconvenienti, ma non possiamo garantire disponibilità continua del servizio.',
      },
      {
        title: '7. Contatto',
        body: 'Per qualsiasi domanda relativa ai termini di servizio: Federico Pasinetti — fede.pasi@gmail.com',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    subtitle: 'Botanica-AI',
    back: '← Back to app',
    lastUpdated: 'Last updated: March 2026',
    sections: [
      {
        title: '1. Beta Version',
        body: 'You are using a non-final beta version of Botanica-AI. Features may change, be removed, or added without prior notice. There are no guarantees of service continuity during the beta phase.',
      },
      {
        title: '2. Your data is yours',
        body: 'The plants, photos, notes, and care plans you create on Botanica-AI are your exclusive property. You can export or delete them at any time by writing to fede.pasi@gmail.com.',
      },
      {
        title: '3. Use of AI',
        body: 'The advice provided by the artificial intelligence is purely informational and does not replace professional agronomic consulting. The app assumes no responsibility for harvest results, plant loss, or damage arising from the use of the provided guidance.',
      },
      {
        title: '4. Free during Beta',
        body: 'The service is completely free during the beta phase. We will give you adequate advance notice if and when we introduce paid plans or changes to the service structure.',
      },
      {
        title: '5. Conduct',
        body: 'Do not use the app to upload or disseminate illegal, offensive, misleading content, or content that violates third-party rights. We reserve the right to suspend or disable accounts in case of abuse or violations.',
      },
      {
        title: '6. Limitation of liability',
        body: 'During the beta, service interruptions, data loss, or unexpected app behavior may occur. We do our best to minimize these inconveniences, but we cannot guarantee continuous service availability.',
      },
      {
        title: '7. Contact',
        body: 'For any questions regarding the terms of service: Federico Pasinetti — fede.pasi@gmail.com',
      },
    ],
  },
};

export const TermsScreen: React.FC = () => {
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
            <i className="fa-solid fa-file-contract text-2xl text-white"></i>
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
