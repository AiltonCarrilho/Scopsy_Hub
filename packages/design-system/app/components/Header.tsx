'use client';

import React, { useState } from 'react';
import { Flame, Droplets } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
    user?: {
        name: string;
        email: string;
        plan: 'free' | 'premium';
        streak_days?: number;
        freshness_multiplier?: number;
    };
}

export default function Header({ user }: HeaderProps) {
    const isPremium = user?.plan === 'premium';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1A2B48] text-white backdrop-blur-md transition-all">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-white">
                        Scopsy Lab<span className="align-super text-[0.5em] opacity-70">®</span>
                    </h1>
                </div>

                {/* Nav */}
                <nav className="flex items-center gap-6">
                    {/* Metrics Compact (Premium) */}
                    {isPremium && (
                        <div className="hidden items-center gap-5 md:flex">
                            <span className="group flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm transition-all hover:-translate-y-px hover:bg-white/15" title="Dias de sequência ativa">
                                <span className="text-base">🔥</span>
                                <strong className="font-bold text-white/95">{user?.streak_days || 0}</strong>
                            </span>
                            <span className="group flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm transition-all hover:-translate-y-px hover:bg-white/15" title="Vigor clínico atual">
                                <span className="text-base">💧</span>
                                <strong className="font-bold text-white/95">{Math.round((user?.freshness_multiplier || 1) * 100)}%</strong>
                            </span>
                        </div>
                    )}

                    {/* Streak Indicator (Trial) - Simplified for now */}
                    {!isPremium && (
                        <div className="hidden items-center gap-2 md:flex" title="Dias consecutivos de prática">
                            <Image src="/assets/icons/streak-flame.svg" alt="Streak" width={20} height={20} className="h-5 w-5" />
                            <span className="font-bold text-amber-500">{user?.streak_days || 0}</span>
                        </div>
                    )}

                    {/* User Name & Logout */}
                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm font-medium text-white/80 sm:block">
                            {user?.name || 'Carregando...'}
                        </span>

                        {/* Portal Button (Premium Only) */}
                        {isPremium && (
                            <button
                                className="hidden rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10 md:block"
                                onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    const originalText = btn.textContent;
                                    btn.textContent = 'Carregando...';

                                    try {
                                        const token = localStorage.getItem('token');
                                        // Ensure we target the root API, not relative to /lab/
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

                                        const res = await fetch(`${apiUrl}/api/payments/create-portal-session`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ returnUrl: window.location.href })
                                        });

                                        const data = await res.json();
                                        if (data.url) {
                                            window.location.href = data.url;
                                        } else {
                                            alert('Erro ao abrir portal: ' + (data.error || 'Erro desconhecido'));
                                            btn.textContent = originalText;
                                        }
                                    } catch (err) {
                                        console.error('Portal Error:', err);
                                        alert('Erro de conexão ao abrir portal');
                                        btn.textContent = originalText;
                                    }
                                }}
                            >
                                Gerenciar Assinatura
                            </button>
                        )}

                        <button
                            className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                            onClick={() => {
                                // Handle logout
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                // Redirect to root/index
                                window.location.href = '/index.html';
                            }}
                        >
                            Sair
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
