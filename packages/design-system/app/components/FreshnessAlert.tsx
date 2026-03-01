'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface FreshnessAlertProps {
    freshness: {
        percentage: number;
        status: string;
        emoji: string;
        message: string;
        description: string;
    };
}

export default function FreshnessAlert({ freshness }: FreshnessAlertProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Check if dismissed today
        if (!freshness) return;

        const dismissedDate = localStorage.getItem('freshness_alert_dismissed');
        const today = new Date().toDateString();

        if (dismissedDate !== today && freshness.percentage < 80) {
            setVisible(true);
        }
    }, [freshness]);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem('freshness_alert_dismissed', new Date().toDateString());
    };

    if (!visible || !freshness) return null;

    // Determine styles strictly based on status or percentage
    let bgClass = 'bg-white';
    let borderClass = 'border-gray-200';
    let iconBg = 'bg-gray-100';

    if (freshness.percentage < 50) {
        bgClass = 'bg-red-50';
        borderClass = 'border-red-200';
        iconBg = 'bg-red-100 text-red-600';
    } else if (freshness.percentage < 80) {
        bgClass = 'bg-orange-50';
        borderClass = 'border-orange-200';
        iconBg = 'bg-orange-100 text-orange-600';
    }

    return (
        <div className={`mx-auto mb-6 flex max-w-6xl items-start justify-between rounded-xl border p-4 shadow-sm ${bgClass} ${borderClass}`}>
            <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${iconBg}`}>
                    {freshness.emoji}
                </div>
                <div>
                    <strong className="block font-bold text-[#1A2B48]">{freshness.message}</strong>
                    <p className="text-sm text-[#64748B]">{freshness.description}</p>
                </div>
            </div>
            <button
                onClick={dismiss}
                className="ml-4 rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-[#64748B]"
            >
                <X size={20} />
            </button>
        </div>
    );
}
