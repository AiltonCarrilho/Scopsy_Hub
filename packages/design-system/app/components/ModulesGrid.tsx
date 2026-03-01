'use client';

import React from 'react';
import { Zap, MessageSquare, Brain, Layers, FileText, TrendingUp, Target, Clock, Lock, Activity, GitBranch } from 'lucide-react';

interface ModulesGridProps {
    user?: any;
    onOpenPremiumModal: () => void;
}

export default function ModulesGrid({ user, onOpenPremiumModal }: ModulesGridProps) {
    const isPremium = user?.plan === 'premium';

    return (
        <section className="py-12">
            <h2 className="mb-12 text-center text-3xl font-bold text-[#1A2B48]">Módulos de Treinamento</h2>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">

                {/* 1. Desafios Clínicos */}
                <a href="/desafios.html" className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-xl">
                    <div className="mb-6 flex items-start justify-between">
                        <div className="h-16 w-16 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <img src="/lab/icons/desafios.png" alt="Desafios Clínicos" width={68} height={68} className="object-contain" />
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#008CE2]">Interativo</span>
                    </div>

                    <h3 className="mb-2 text-2xl font-bold text-[#1A2B48]">Desafios Clínicos</h3>
                    <p className="mb-8 flex-grow text-[#64748B] leading-relaxed">
                        Micro-decisões clínicas (30-60s) em situações críticas com feedback formativo imediato.
                    </p>

                    <div className="mb-8 flex flex-col gap-3">
                        <FeatureTag icon={Zap} text="Simulação de reação" />
                        <FeatureTag icon={MessageSquare} text="Feedback formativo" />
                        <FeatureTag icon={Brain} text="Reflexão metacognitiva" />
                    </div>

                    <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-6 text-sm font-semibold text-[#64748B]">
                        <Layers size={16} /> Todos os níveis
                    </div>
                </a>

                {/* 2. Conceituação Cognitiva */}
                <a href="/conceituacao.html" className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-xl">
                    <div className="mb-6 flex items-start justify-between">
                        <div className="h-16 w-16 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <img src="/lab/icons/conceituacao.png" alt="Conceituação Cognitiva" width={68} height={68} className="object-contain" />
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#008CE2]">TCC Profundo</span>
                    </div>

                    <h3 className="mb-2 text-2xl font-bold text-[#1A2B48]">Conceituação Cognitiva</h3>
                    <p className="mb-8 flex-grow text-[#64748B] leading-relaxed">
                        Formulação completa TCC: tríade cognitiva, crenças e plano de intervenção estruturado.
                    </p>

                    <div className="mb-8 flex flex-col gap-3">
                        <FeatureTag icon={Brain} text="Formulação TCC" />
                        <FeatureTag icon={Layers} text="4 componentes" />
                        <FeatureTag icon={FileText} text="Feedback detalhado" />
                    </div>

                    <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-6 text-sm font-semibold text-[#64748B]">
                        <FileText size={16} /> Conceituação Beck
                    </div>
                </a>

                {/* 3. Radar Diagnóstico */}
                <a href="/diagnostic.html" className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-xl">
                    <div className="mb-6 flex items-start justify-between">
                        <div className="h-16 w-16 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <img src="/lab/icons/radar.png" alt="Radar Diagnóstico" width={68} height={68} className="object-contain" />
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#008CE2]">Repetição Espaçada</span>
                    </div>

                    <h3 className="mb-2 text-2xl font-bold text-[#1A2B48]">Radar Diagnóstico</h3>
                    <p className="mb-8 flex-grow text-[#64748B] leading-relaxed">
                        Pratique diagnósticos DSM-5 com metodologia de repetição espaçada e feedback imediato.
                    </p>

                    <div className="mb-8 flex flex-col gap-3">
                        <FeatureTag icon={TrendingUp} text="Progressão adaptativa" />
                        <FeatureTag icon={Target} text="Casos de alta precisão" />
                        <FeatureTag icon={Clock} text="Repetição espaçada" />
                    </div>

                    <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-6 text-sm font-semibold text-[#64748B]">
                        Treino sistemático DSM-5
                    </div>
                </a>

                {/* 4. Jornada Clínica */}
                {isPremium ? (
                    <a href="/jornada.html" className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-xl">
                        <JornadaContent />
                    </a>
                ) : (
                    <div
                        onClick={onOpenPremiumModal}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-xl opacity-90 grayscale hover:grayscale-0"
                    >
                        <JornadaContent />
                    </div>
                )}

            </div>
        </section>
    );
}

function JornadaContent() {
    return (
        <>
            <div className="mb-6 flex items-start justify-between">
                <div className="h-16 w-16 transition-transform group-hover:scale-110 group-hover:rotate-6">
                    <img src="/lab/icons/jornada.png" alt="Jornada Clínica" width={68} height={68} className="object-contain" />
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">12 Sessões</span>
            </div>

            <h3 className="mb-2 text-2xl font-bold text-[#1A2B48]">Jornada Clínica</h3>
            <p className="mb-8 flex-grow text-[#64748B] leading-relaxed">
                Acompanhe um caso completo de TCC através de 12 sessões progressivas.
            </p>

            <div className="mb-8 flex flex-col gap-3">
                <FeatureTag icon={Lock} text="Exclusivo Premium" className="text-amber-500" />
                <FeatureTag icon={Activity} text="Evolução longitudinal" />
                <FeatureTag icon={GitBranch} text="Decisões críticas" />
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-6 text-sm font-semibold text-[#64748B]">
                Jornada terapêutica completa
            </div>
        </>
    )
}

function FeatureTag({ icon: Icon, text, className = "text-[#64748B]" }: { icon: any, text: string, className?: string }) {
    return (
        <div className={`flex items-center gap-2 text-sm font-medium ${className}`}>
            <Icon size={16} className={className.includes('amber') ? 'text-amber-500' : 'text-[#008CE2]'} />
            <span>{text}</span>
        </div>
    );
}
