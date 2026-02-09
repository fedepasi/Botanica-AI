import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useGarden } from '../hooks/useGarden';
import { chatWithBotanica } from '../services/geminiService';
import { Message } from '../types';

export const ChatScreen: React.FC = () => {
    const { t, language } = useTranslation();
    const { plants } = useGarden();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: t('botanicaGreeting'),
            sender: 'botanica',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const responseText = await chatWithBotanica(
                [...messages, userMsg].map(m => ({ text: m.text, sender: m.sender })),
                plants,
                language
            );

            const botanicaMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'botanica',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botanicaMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: t('errorChat'),
                sender: 'botanica',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] bg-garden-beige font-outfit">
            {/* Header */}
            <div className="bg-garden-green p-6 shadow-xl rounded-b-[40px] flex items-center justify-between z-10 border-b-4 border-garden-yellow">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/30">
                        <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-widest">{t('botanicaAdvisor')}</h1>
                        <p className="text-[10px] text-garden-yellow font-black flex items-center uppercase tracking-tighter">
                            <span className="w-2 h-2 bg-garden-yellow rounded-full mr-2 animate-pulse"></span>
                            {t('online')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 pt-10">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div
                            className={`max-w-[85%] p-5 rounded-[32px] shadow-sm relative ${m.sender === 'user'
                                ? 'bg-garden-green text-white rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}
                        >
                            <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                            <span className={`text-[9px] mt-2 block font-bold uppercase tracking-widest opacity-40 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {m.sender === 'botanica' && (
                                <div className="absolute top-0 -left-1 w-1 h-8 bg-garden-yellow rounded-full"></div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm flex space-x-2">
                            <div className="w-2 h-2 bg-garden-green/30 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-garden-green/30 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-garden-green/30 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-transparent">
                <div className="flex items-center space-x-3 bg-white p-3 rounded-[32px] border-2 border-transparent shadow-2xl shadow-garden-green/10 focus-within:border-garden-green transition-all">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('chatPlaceholder')}
                        className="flex-grow bg-transparent px-4 py-2 focus:outline-none text-sm font-medium"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!inputValue.trim() || isTyping ? 'text-gray-300 bg-gray-50' : 'bg-garden-green text-white shadow-lg shadow-garden-green/20 active:scale-90'
                            }`}
                    >
                        <i className="fa-solid fa-paper-plane text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
