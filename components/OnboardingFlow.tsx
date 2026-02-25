import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

interface OnboardingSlide {
  icon: string;
  iconBg: string;
  titleKey: string;
  descKey: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: 'fa-seedling',
    iconBg: 'bg-garden-green',
    titleKey: 'onboarding1Title',
    descKey: 'onboarding1Desc',
    color: 'text-garden-green',
  },
  {
    icon: 'fa-calendar-days',
    iconBg: 'bg-blue-500',
    titleKey: 'onboarding2Title',
    descKey: 'onboarding2Desc',
    color: 'text-blue-500',
  },
  {
    icon: 'fa-comments',
    iconBg: 'bg-purple-500',
    titleKey: 'onboarding3Title',
    descKey: 'onboarding3Desc',
    color: 'text-purple-500',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      navigate('/garden/add');
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-garden-beige flex flex-col items-center justify-between px-6 py-12 font-outfit">
      {/* Skip button */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleSkip}
          className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
        >
          {t('onboardingSkip') || 'Skip'}
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto">
        {/* Icon */}
        <div
          className={`w-32 h-32 ${slide.iconBg} rounded-[40px] flex items-center justify-center mb-10 shadow-2xl`}
          style={{ boxShadow: `0 20px 60px -10px rgba(0,0,0,0.18)` }}
        >
          <i className={`fa-solid ${slide.icon} text-5xl text-white`}></i>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4">
          {t(slide.titleKey) || slide.titleKey}
        </h2>

        {/* Description */}
        <p className="text-gray-500 font-medium text-base leading-relaxed">
          {t(slide.descKey) || slide.descKey}
        </p>
      </div>

      {/* Dots */}
      <div className="flex items-center space-x-2 mb-8">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? 'w-6 h-3 bg-garden-green'
                : 'w-3 h-3 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={handleNext}
        className="w-full py-5 bg-garden-green text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-garden-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
      >
        {isLast ? (
          <>
            <i className="fa-solid fa-plus mr-3 text-lg"></i>
            {t('onboardingAddFirstPlant') || 'Add My First Plant'}
          </>
        ) : (
          <>
            {t('onboardingNext') || 'Next'}
            <i className="fa-solid fa-arrow-right ml-3"></i>
          </>
        )}
      </button>
    </div>
  );
};
