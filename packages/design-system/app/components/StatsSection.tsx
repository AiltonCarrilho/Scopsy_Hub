'use client';

import React from 'react';
import { MessageCircle, FileText, Stethoscope, Award, PieChart, BookOpen, Lock, Clock } from 'lucide-react';

interface StatsSectionProps {
    user: any;
}

export default function StatsSection({ user }: StatsSectionProps) {
    const isPremium = user?.plan === 'premium';

    if (isPremium) {
        return (
            <section className="mt-16 border-t border-gray-100 pt-16">
                <h2 className="mb-12 text-center text-3xl font-bold text-[#1A2B48]">Seu Progresso</h2>
                <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
                    <StatCard icon={MessageCircle} value="0" label="Raciocínio Clínico" />
                    <StatCard icon={FileText} value="0" label="Radar Diagnóstico" />
                    <StatCard icon={Stethoscope} value="0" label="Jornada Terapêutica" />
                    <StatCard icon={Award} value="0" label="Cognits" />
                </div>
            </section>
        );
    }

    // Trial View
    return (
        <section className="mt-16 border-t border-gray-100 pt-16">
            <h2 className="mb-12 text-center text-3xl font-bold text-[#1A2B48]">Seu Limite Trial</h2>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-[#008CE2]">
                        <PieChart size={24} />
                    </div>
                    <div className="mb-1 text-3xl font-bold text-[#1A2B48]">30<span className="text-gray-400 text-xl">/30</span></div>
                    <div className="mb-4 text-sm font-medium text-[#64748B]">Raciocínio + Radar</div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
                        <div className="h-full bg-[#008CE2]" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-[#008CE2]">
                        <BookOpen size={24} />
                    </div>
                    <div className="mb-1 text-3xl font-bold text-[#1A2B48]">7<span className="text-gray-400 text-xl">/7</span></div>
                    <div className="mb-4 text-sm font-medium text-[#64748B]">Conceituação</div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
                        <div className="h-full bg-[#008CE2]" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-6 shadow-sm ring-1 ring-black/5 opacity-70">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-[#64748B]">
                        <Lock size={24} />
                    </div>
                    <div className="mb-1 text-3xl font-bold text-gray-400">Locked</div>
                    <div className="text-sm font-medium text-[#64748B]">Jornada (Premium)</div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                        <Clock size={24} />
                    </div>
                    <div className="mb-1 text-3xl font-bold text-[#1A2B48]">{user?.trial_days_left || 7}</div>
                    <div className="text-sm font-medium text-[#64748B]">Dias Restantes</div>
                </div>

            </div>
        </section>
    );
}

function StatCard({ icon: Icon, value, label }: { icon: any, value: string, label: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 transition-all hover:translate-y-[-2px] hover:shadow-md">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-[#008CE2]">
                <Icon size={32} />
            </div>
            <div className="mb-2 text-3xl font-extrabold text-[#1A2B48]">{value}</div>
            <div className="text-sm font-medium text-[#64748B]">{label}</div>
        </div>
    );
}
