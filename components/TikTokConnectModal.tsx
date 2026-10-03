'use client';

import React, { useState } from 'react';
import { Sparkles, X, Wifi, Radio, Gift, Heart, UserPlus, MessageSquare, Play } from 'lucide-react';
import { FraksiKerajaan } from '@/lib/gameTypes';

interface TikTokConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (username: string) => void;
  onDisconnect: () => void;
  statusKoneksi: 'connected' | 'connecting' | 'disconnected' | 'error';
  currentUsername: string;
  pesanStatus: string;
  isSocketServerOnline: boolean;
  onSimulasiEvent: (payload: {
    tipe: string;
    fraksi?: FraksiKerajaan;
    pengirim?: string;
    komentar?: string;
    jumlah?: number;
    namaGift?: string;
    koin?: number;
  }) => void;
}

export const TikTokConnectModal: React.FC<TikTokConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  statusKoneksi,
  currentUsername,
  pesanStatus,
  isSocketServerOnline,
  onSimulasiEvent
}) => {
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    onConnect(usernameInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
              <Radio className="w-4 h-4 text-pink-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Integrasi TikTok Live
              </h3>
              <p className="text-[11px] text-slate-400">
                Hubungkan siaran langsung atau uji simulasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs text-slate-300">
          {/* Status Server & Koneksi */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Wifi
                className={`w-4 h-4 ${
                  isSocketServerOnline ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <div>
                <div className="text-[11px] font-semibold text-slate-200">
                  Status Server Socket.IO
                </div>
                <div className="text-[10px] text-slate-400">
                  {isSocketServerOnline ? 'Aktif (Node.js Port 3000)' : 'Mode Simulator Standalone'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                statusKoneksi === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : statusKoneksi === 'connecting'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {statusKoneksi === 'connected'
                ? 'Terhubung'
                : statusKoneksi === 'connecting'
                ? 'Menghubungkan'
                : statusKoneksi === 'error'
                ? 'Gagal'
                : 'Terputus'}
            </span>
          </div>

          {/* Form Input Username TikTok */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-200">
              Username TikTok (Streamer yang sedang Live)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="contoh: streamer_live"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {statusKoneksi === 'connected' ? (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition active:scale-95"
                >
                  Putuskan
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={statusKoneksi === 'connecting'}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {statusKoneksi === 'connecting' ? 'Menghubungkan...' : 'Hubungkan'}
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {pesanStatus}
            </p>
          </form>

          {/* Panduan Aturan TikTok Live */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ATURAN & RESPON EVENT TIKTOK</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-emerald-400">Komentar &quot;1&quot;:</strong> Spawn Prajurit Hijau (Sebanyak jumlah markas Hijau).
              </li>
              <li>
                <strong className="text-amber-400">Komentar &quot;2&quot;:</strong> Spawn Prajurit Kuning (Sebanyak jumlah markas Kuning).
              </li>
              <li>
                <strong className="text-blue-400">Komentar &quot;3&quot;:</strong> Spawn Prajurit Biru (Sebanyak jumlah markas Biru).
              </li>
              <li>
                <strong className="text-rose-400">Tap-Tap Layar (Likes):</strong> Spawn Monster Merah di Zona Tengah.
              </li>
              <li>
                <strong className="text-rose-400">Follow Baru:</strong> Tambah 1 Markas untuk Kerajaan Monster (Merah).
              </li>
              <li>
                <strong className="text-amber-300">Gift Koin 1 (Mawar/GG/Kopi):</strong> Spawn Ksatria Kerajaan (Mawar=Hijau, GG=Kuning, Kopi=Biru).
              </li>
              <li>
                <strong className="text-yellow-300">Ksatria Pengecut (Lucu 😱):</strong> Terkadang muncul dari Gift Koin 1! Warnanya lebih pudar, lari terbirit-birit saat ada musuh (Speed 3.6x, ATK 1), dan jago menyelinap merebut teritorial musuh!
              </li>
              <li>
                <strong className="text-purple-300">Gift 100+ Koin:</strong> Tambah 1 Markas untuk kerajaan yang dibela pengirim!
              </li>
              <li>
                <strong className="text-cyan-400">Markas Kerajaan:</strong> Memiliki HP 10.000 dan dapat diserbu/dihancurkan unit lawan! Fraksi yang bertahan menang mutlak.
              </li>
            </ul>
          </div>

          {/* Panel Uji Coba Simulasi Langsung */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Uji Coba Simulasi Event (Tanpa Live Asli)</span>
              </span>
              <span className="text-[9px] text-slate-500 font-normal">Klik untuk trigger</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_prajurit_chat',
                    fraksi: 'hijau',
                    pengirim: 'Budi TikTok',
                    komentar: '1'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 font-medium text-left transition active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Simulasi Chat &quot;1&quot; (Hijau)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_prajurit_chat',
                    fraksi: 'kuning',
                    pengirim: 'Siti TikTok',
                    komentar: '2'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-200 font-medium text-left transition active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Simulasi Chat &quot;2&quot; (Kuning)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_prajurit_chat',
                    fraksi: 'biru',
                    pengirim: 'Andi TikTok',
                    komentar: '3'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-200 font-medium text-left transition active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Simulasi Chat &quot;3&quot; (Biru)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_monster_like',
                    jumlah: 3,
                    pengirim: 'Penonton Tap'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-medium text-left transition active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40 shrink-0" />
                <span>Simulasi Like (Monster)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'tambah_markas_follow',
                    pengirim: 'Follower Baru'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-medium text-left transition active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Simulasi Follow (+Markas Monster)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_ksatria_gift',
                    fraksi: 'hijau',
                    namaGift: 'Mawar',
                    koin: 1,
                    pengirim: 'Sultan Mawar'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-400 text-emerald-200 font-medium text-left transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mawar 🌹 (Ksatria Hijau)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'spawn_ksatria_gift',
                    fraksi: 'kuning',
                    namaGift: 'GG',
                    koin: 1,
                    pengirim: 'Gamer GG'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-400 text-amber-200 font-medium text-left transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Gift GG ⭐ (Ksatria Kuning)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulasiEvent({
                    tipe: 'tambah_markas_gift_mahal',
                    fraksi: 'biru',
                    namaGift: 'Paus Laut Biru',
                    koin: 200,
                    pengirim: 'Sultan Paus'
                  })
                }
                className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-medium text-left transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Gift Sultan (+Markas Biru)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
