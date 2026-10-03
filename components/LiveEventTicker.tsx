'use client';

import React from 'react';
import { EventTikTokLog } from '@/lib/gameTypes';
import { MessageSquare, Heart, UserPlus, Gift, ShieldAlert } from 'lucide-react';

interface LiveEventTickerProps {
  logs: EventTikTokLog[];
}

export const LiveEventTicker: React.FC<LiveEventTickerProps> = ({ logs }) => {
  const getIkonTipe = (tipe: EventTikTokLog['tipe']) => {
    switch (tipe) {
      case 'chat':
        return <MessageSquare className="w-3 h-3 text-cyan-400" />;
      case 'like':
        return <Heart className="w-3 h-3 text-rose-400 fill-rose-400/50" />;
      case 'follow':
        return <UserPlus className="w-3 h-3 text-emerald-400" />;
      case 'gift':
        return <Gift className="w-3 h-3 text-amber-400" />;
      default:
        return <ShieldAlert className="w-3 h-3 text-slate-400" />;
    }
  };

  const getWarnaBorder = (fraksi?: string) => {
    if (fraksi === 'hijau') return 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200';
    if (fraksi === 'kuning') return 'border-amber-500/40 bg-amber-950/60 text-amber-200';
    if (fraksi === 'biru') return 'border-blue-500/40 bg-blue-950/60 text-blue-200';
    if (fraksi === 'monster') return 'border-rose-500/40 bg-rose-950/60 text-rose-200';
    return 'border-white/10 bg-black/60 text-slate-200';
  };

  return (
    <div className="absolute bottom-16 left-3 w-64 max-h-48 overflow-hidden pointer-events-none flex flex-col-reverse gap-1.5 z-20">
      {logs.slice(0, 5).map((log) => (
        <div
          key={log.id}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border text-[11px] font-medium shadow-md transition-all duration-300 animate-fadeIn ${getWarnaBorder(
            log.fraksi
          )}`}
        >
          <span className="shrink-0">{getIkonTipe(log.tipe)}</span>
          <span className="font-bold text-white truncate max-w-[80px]">
            {log.pengirim}
          </span>
          <span className="text-[10px] opacity-90 truncate flex-1">
            {log.pesan}
          </span>
        </div>
      ))}
    </div>
  );
};
