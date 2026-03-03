import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService } from '../services/supabaseService';

type FeedbackType = 'bug' | 'ux' | 'idea' | 'praise';

interface FeedbackOption {
  type: FeedbackType;
  emoji: string;
  labelIt: string;
  labelEn: string;
  color: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { type: 'bug', emoji: '🐛', labelIt: 'Bug', labelEn: 'Bug', color: 'bg-red-50 border-red-200 text-red-700' },
  { type: 'ux', emoji: '😕', labelIt: 'Confuso', labelEn: 'Confusing', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { type: 'idea', emoji: '💡', labelIt: 'Idea', labelEn: 'Idea', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { type: 'praise', emoji: '⭐', labelIt: 'Mi piace!', labelEn: 'Love it!', color: 'bg-green-50 border-green-200 text-green-700' },
];

export const FeedbackWidget: React.FC = () => {
  const { language } = useTranslation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const it = language === 'it';

  const handleOpen = () => {
    setIsOpen(true);
    setSubmitted(false);
    setSelectedType(null);
    setMessage('');
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedType || !message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackService.submitFeedback({
        userId: user?.id || null,
        userEmail: user?.email || null,
        feedbackType: selectedType,
        message: message.trim(),
        currentScreen: window.location.hash || '/',
        appLanguage: language,
      });
      setSubmitted(true);
    } catch (e) {
      console.error('Feedback submission failed:', e);
      setError(it
        ? 'Invio fallito. Riprova.'
        : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-garden-green text-white rounded-full shadow-lg shadow-garden-green/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        aria-label={it ? 'Invia feedback' : 'Send feedback'}
        title={it ? 'Invia feedback' : 'Send feedback'}
      >
        <i className="fa-solid fa-comment-dots text-lg"></i>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              /* Success state */
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🌱</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                  {it ? 'Grazie!' : 'Thank you!'}
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  {it
                    ? 'Il tuo feedback ci aiuta a migliorare Botanica-AI.'
                    : 'Your feedback helps us improve Botanica-AI.'}
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-3 bg-garden-green text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  {it ? 'Chiudi' : 'Close'}
                </button>
              </div>
            ) : (
              /* Form state */
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      {it ? 'Invia Feedback' : 'Send Feedback'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {it ? 'Beta v1 · Il tuo parere conta' : 'Beta v1 · Your opinion matters'}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setSelectedType(opt.type)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        selectedType === opt.type
                          ? `${opt.color} border-current scale-105 shadow-md`
                          : 'bg-garden-beige border-transparent text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl mb-1">{opt.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {it ? opt.labelIt : opt.labelEn}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Message input */}
                <textarea
                  className="w-full p-4 bg-garden-beige rounded-2xl text-sm text-gray-700 font-medium resize-none border-2 border-transparent focus:border-garden-green outline-none transition-all"
                  rows={3}
                  placeholder={it
                    ? 'Descrivi il problema o la tua idea...'
                    : 'Describe the issue or your idea...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
                <p className="text-right text-[10px] text-gray-400 mt-1 font-medium">
                  {message.length}/500
                </p>

                {/* Error */}
                {error && (
                  <p className="text-red-500 text-xs font-medium mt-2">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedType || !message.trim() || isSubmitting}
                  className="w-full mt-4 bg-garden-green text-white py-4 rounded-[24px] font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-garden-green/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane text-sm"></i>
                      <span>{it ? 'Invia' : 'Submit'}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
