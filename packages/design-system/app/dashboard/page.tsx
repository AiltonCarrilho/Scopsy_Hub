'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import GamificationGrid from '../components/GamificationGrid';
import ModulesGrid from '../components/ModulesGrid';
import StatsSection from '../components/StatsSection';
import MissionsSection from '../components/MissionsSection';
import PremiumModal from '../components/PremiumModal';
import FreshnessAlert from '../components/FreshnessAlert';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [freshness, setFreshness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Check Auth & Load User Data from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      // STRICT REDIRECT TO LOGIN
      window.location.href = '/login.html';
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // 2. Validate Token & Fetch Latest Data
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const TIMEOUT_MS = 8000;

        // B. Load User Stats (Progress Summary)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

          const resStats = await fetch(`${apiUrl}/api/progress/summary`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resStats.ok) {
            const dataStats = await resStats.json();
            const updatedUser = { ...JSON.parse(userData || '{}'), ...dataStats };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            console.warn('Falha ao carregar estatísticas:', resStats.status);
          }
        } catch (e) {
          console.error('Erro de conexão (Stats):', e);
        }

        // C. Load Freshness
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

          const resFreshness = await fetch(`${apiUrl}/api/freshness/status`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resFreshness.ok) {
            const dataFreshness = await resFreshness.json();
            if (dataFreshness.success && dataFreshness.freshness) {
              setFreshness(dataFreshness.freshness);
              setUser((prev: any) => ({
                ...prev,
                freshness_multiplier: dataFreshness.freshness.percentage / 100
              }));
            }
          }
        } catch (e) {
          console.error('Erro de conexão (Freshness):', e);
        }

      } catch (error) {
        console.error('Erro geral no dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">

        {/* Freshness Alert (if low) */}
        {freshness && <FreshnessAlert freshness={freshness} />}

        {/* Hero Section */}
        <section className="mx-auto max-w-3xl py-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-[#1A2B48] md:text-5xl">
            Bem-vindo ao Scopsy Lab<span className="align-super text-[0.5em] opacity-70">®</span>
          </h1>
          <p className="text-lg text-[#64748B]">
            Seu laboratório de prática clínica. Escolha um módulo de treino e desenvolva suas habilidades com simulações realistas e feedback imediato.
          </p>
        </section>

        {/* Gamification Grid (Level & Freshness) - Only visible if premium */}
        {user?.plan === 'premium' && <GamificationGrid user={user} />}

        {/* Missions */}
        <MissionsSection />

        {/* Modules Grid */}
        <ModulesGrid user={user} onOpenPremiumModal={() => setIsModalOpen(true)} />

        {/* Stats Section / Trial Info */}
        <StatsSection user={user} />

        {/* Spacer */}
        <div className="h-16"></div>
      </main>

      {/* Premium Upgrade Modal */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}