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
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{t('botanicaAdvisor')}</h1>
                        <p className="text-xs text-green-600 font-semibold flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${m.sender === 'user'
                                    ? 'bg-green-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}
                        >
                            <p className="text-sm leading-relaxed">{m.text}</p>
                            <span className={`text-[10px] mt-2 block opacity-70 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex space-x-1">
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t pb-8">
                <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-2xl border focus-within:ring-2 focus-within:ring-green-400 transition-all">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('chatPlaceholder')}
                        className="flex-grow bg-transparent p-2 focus:outline-none text-sm"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!inputValue.trim() || isTyping ? 'text-gray-400' : 'bg-green-600 text-white shadow-md active:scale-95'
                            }`}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
