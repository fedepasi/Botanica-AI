import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';

export const AuthScreen: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-garden-beige px-4 py-12 sm:px-6 lg:px-8 font-outfit">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-garden-green/5 border border-gray-100">
                <div className="text-center">
                    <div className="w-24 h-24 bg-garden-green rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-garden-green/20">
                        <i className="fa-solid fa-seedling text-4xl text-white"></i>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                        {isSignUp ? (
                            <span>Create <span className="highlight-yellow inline-block">Account</span></span>
                        ) : (
                            <span>Welcome <span className="highlight-yellow inline-block">Back</span></span>
                        )}
                    </h2>
                    <p className="mt-4 text-gray-500 font-medium italic">
                        {isSignUp ? t('joinCommunity') || 'Join the community of premium gardeners' : t('signInMessage') || 'Sign in to manage your premium garden'}
                    </p>
                </div>

                <form className="mt-10 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-xs font-black uppercase tracking-widest text-garden-green mb-2 ml-2">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-6 py-4 bg-garden-beige/30 border-2 border-transparent placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:bg-white focus:border-garden-yellow transition-all font-medium"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-garden-green mb-2 ml-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-6 py-4 bg-garden-beige/30 border-2 border-transparent placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:bg-white focus:border-garden-yellow transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-5 rounded-2xl text-sm font-bold animate-fade-in ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-garden-green/10 text-garden-green border border-garden-green/10'}`}>
                            <div className="flex items-center">
                                <i className={`fa-solid ${message.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} mr-3`}></i>
                                {message.text}
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-5 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white transition-all transform hover:-translate-y-1 active:scale-95 ${loading ? 'bg-garden-green/40 cursor-not-allowed' : 'bg-garden-green hover:bg-garden-green/90 shadow-xl shadow-garden-green/20'
                                }`}
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch animate-spin text-xl"></i>
                            ) : (
                                isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center pt-4">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-xs font-black uppercase tracking-widest text-garden-green/60 hover:text-garden-green transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};
