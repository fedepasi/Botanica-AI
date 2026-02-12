import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface SpinnerProps {
    text?: string;
    size?: 'small' | 'medium' | 'large';
}

export const Spinner: React.FC<SpinnerProps> = ({ text, size = 'medium' }) => {
    const { t } = useTranslation();
    const displayText = text || t('loading');
    
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        medium: 'w-12 h-12 border-4',
        large: 'w-16 h-16 border-4'
    };
    
    return (
        <div className={`flex flex-col items-center justify-center ${size === 'small' ? 'p-2' : 'p-8'} text-center`}>
            <div className={`${sizeClasses[size]} border-green-400 border-t-transparent rounded-full animate-spin`}></div>
            {size !== 'small' && <p className="mt-4 text-lg text-green-700 font-medium">{displayText}</p>}
        </div>
    );
};