import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface SpinnerProps {
    text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text }) => {
    const { t } = useTranslation();
    const displayText = text || t('loading');
    
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-green-700 font-medium">{displayText}</p>
        </div>
    );
};