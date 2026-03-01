'use client';

import React, { useState } from 'react';
import { Crown, Check, X } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Link direto do Kiwify
            const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/cMd4tVk';

            // Pegar email do usuário se estiver logado
            const token = localStorage.getItem('token');
            let userEmail = '';

            if (token) {
                try {
                    // Basic JWT decode
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userEmail = payload.email || '';
                } catch (e) {
                    console.warn('Erro ao decodificar token:', e);
                }
            }

            // Montar URL com email
            const checkoutUrl = userEmail
                ? `${KIWIFY_CHECKOUT_URL}?email=${encodeURIComponent(userEmail)}`
                : KIWIFY_CHECKOUT_URL;

            // Aguardar 300ms para UX
            await new Promise(resolve => setTimeout(resolve, 300));

            // Redirecionar
            window.location.href = checkoutUrl;
        } catch (err) {
            console.error('Erro de checkout:', err);
            alert('Erro ao redirecionar para checkout.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-sm transition-all" onClick={onClose}>
            <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all" onClick={e => e.stopPropagation()}>
                <button
                    className="absolute right-4 top-4 text-gray-400 hover:text-[#64748B] transition-colors"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-500 shadow-inner">
                        <Crown size={40} />
                    </div>
                </div>

                <h2 className="mb-2 text-center text-2xl font-bold text-[#1A2B48]">Acesso Exclusivo Premium</h2>
                <p className="mb-6 text-center text-[#64748B]">
                    A <strong>Jornada Clínica</strong> é uma simulação completa de tratamento longitudinal.
                </p>

                <ul className="mb-8 space-y-3">
                    <li className="flex items-start gap-3 text-[#1A2B48]">
                        <div className="rounded-full bg-green-100 p-1 text-green-600"><Check size={14} strokeWidth={3} /></div>
                        <span>Acompanhe o paciente por 12 sessões</span>
                    </li>
                    <li className="flex items-start gap-3 text-[#1A2B48]">
                        <div className="rounded-full bg-green-100 p-1 text-green-600"><Check size={14} strokeWidth={3} /></div>
                        <span>Veja o impacto das suas decisões a longo prazo</span>
                    </li>
                    <li className="flex items-start gap-3 text-[#1A2B48]">
                        <div className="rounded-full bg-green-100 p-1 text-green-600"><Check size={14} strokeWidth={3} /></div>
                        <span>Acesso a métricas avançadas de evolução</span>
                    </li>
                </ul>

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-orange-500/30 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {loading ? 'Redirecionando...' : 'Desbloquear Agora'}
                </button>
            </div>
        </div>
    );
}
