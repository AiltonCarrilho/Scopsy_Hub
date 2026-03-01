'use client';

import React from 'react';
import Image from 'next/image';

interface GamificationGridProps {
    user: any;
}

export default function GamificationGrid({ user }: GamificationGridProps) {
    // Mock data or use user data
    const level = user?.level || 1;
    const title = user?.clinical_title || 'Estudante de Lente';
    const cognits = user?.cognits || 0;
    const nextLevelAt = user?.next_level?.at || 151;
    const remaining = user?.next_level?.remaining || (nextLevelAt - cognits);
    const progress = Math.min(100, (cognits / nextLevelAt) * 100);

    const freshness = user?.freshness_multiplier || 1.0; // 0 to 1
    const freshnessPercent = Math.round(freshness * 100);

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-6xl mx-auto mb-8">
            {/* Level Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-2xl">
                            ⚡
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#64748B]">Nível <span className="text-[#008CE2] font-bold">{level}</span></p>
                            <h3 className="text-xl font-bold text-[#1A2B48]">{title}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 ring-1 ring-[#008CE2]/10">
                        <Image src="/assets/icons/cognit-24.svg" alt="Cognit" width={20} height={20} className="h-5 w-5" />
                        <span className="font-bold text-[#1A2B48]">{colFormat(cognits)}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="mb-2 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="bg-gradient-to-r from-[#008CE2] to-[#2DD4BF] transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-[#64748B]">
                        <span>{colFormat(cognits)}</span>
                        <span>{colFormat(nextLevelAt)} cognits</span>
                    </div>
                </div>

                <p className="text-sm text-[#64748B]">
                    Faltam <strong className="text-[#1A2B48]">{colFormat(remaining)}</strong> cognits para <span className="text-[#008CE2] font-semibold">{getNextLevelName(level)}</span>
                </p>
            </div>

            {/* Freshness Indicator */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-md group">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50 transition-transform group-hover:scale-110"></div>

                <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl transition-transform group-hover:scale-110">
                            🔥
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#1A2B48]">Vigor Clínico</h4>
                            <span className={`text-2xl font-black ${freshnessPercent >= 80 ? 'text-green-500' : freshnessPercent >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                {freshnessPercent}%
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full transition-all duration-1000 ${freshnessPercent >= 80 ? 'bg-green-500' : freshnessPercent >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${freshnessPercent}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-sm text-[#64748B]">
                        {freshnessPercent === 100
                            ? "Sua mente está afiada! Continue praticando para manter o ritmo."
                            : "Pratique regularmente para recuperar seu vigor clínico."}
                    </p>
                </div>
            </div>
        </div>
    );
}

function colFormat(num: number) {
    return new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(num);
}

function getNextLevelName(currentLevel: number) {
    const levels: Record<number, string> = {
        1: 'Observador Clínico',
        2: 'Apontador de Sintomas',
        3: 'Decodificador Diagnóstico',
        4: 'Mapeador de Comorbidades',
        5: 'Construtor de Linha do Tempo',
        6: 'Lente Rápida',
        7: 'Escultor de Conceituação',
        8: 'Terapeuta de Estratégia',
        9: 'Arquiteto Cognitivo',
        10: 'Mentor de Diagnóstico',
        11: 'Clínico de Alta Performance',
        12: 'Maestria Absoluta'
    };
    return levels[currentLevel + 1] || 'Maestria Absoluta';
}
