'use client';

import React from 'react';
import { DATA_FRAKSI } from '@/lib/gameConstants';
import { FaseGame, StatistikSkor } from '@/lib/gameTypes';
import { soundEffects } from '@/lib/soundEffects';
import { Volume2, VolumeX, Shield, Swords, Crown, Sparkles } from 'lucide-react';

interface ScoreboardOverlayProps {
  fase: FaseGame;
  waktuSisa: number;
  skor: StatistikSkor;
  isSoundActive: boolean;
  onToggleSound: () => void;
  onBukaKoneksi: () => void;
  statusKoneksi: 'connected' | 'connecting' | 'disconnected' | 'error';
  tiktokUsername: string;
}

export const ScoreboardOverlay: React.FC<ScoreboardOverlayProps> = ({
  fase,
  waktuSisa,
  skor,
  isSoundActive,
  onToggleSound,
  onBukaKoneksi,
  statusKoneksi,
  tiktokUsername
}) => {
  // Format waktu mm:ss
  const formatWaktu = (detik: number) => {
    const s = Math.max(0, Math.floor(detik));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (statusKoneksi) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE @{tiktokUsername || 'Tersambung'}
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Menyambung...
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Gagal Tersambung
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            TikTok Offline
          </span>
        );
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-3 z-30 pointer-events-none flex flex-col gap-2">
      {/* Baris Atas: Header Streamer & Timer */}
      <div className="flex items-center justify-between gap-2">
        {/* Tombol Hubungkan & Status */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onBukaKoneksi}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-semibold shadow-lg transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Koneksi TikTok</span>
          </button>
          <div className="pointer-events-auto cursor-pointer" onClick={onBukaKoneksi}>
            {getStatusBadge()}
          </div>
        </div>

        {/* Timer Hitung Mundur */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-lg bg-black/70 border-white/15">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {fase === 'persiapan' ? 'Persiapan' : fase === 'pertarungan' ? 'Pertarungan' : 'Selesai'}
              </div>
              <div
                className={`text-lg font-black font-mono leading-none ${
                  fase === 'persiapan'
                    ? 'text-amber-400'
                    : waktuSisa <= 30
                    ? 'text-rose-500 animate-pulse'
                    : 'text-white'
                }`}
              >
                {fase === 'persiapan' ? `${Math.ceil(waktuSisa)}s` : formatWaktu(waktuSisa)}
              </div>
            </div>
          </div>

          {/* Tombol Suara */}
          <button
            onClick={onToggleSound}
            className="pointer-events-auto p-2 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition active:scale-95"
            title={isSoundActive ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {isSoundActive ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Baris Tengah: Bar Persentase Penguasaan Wilayah Dinamis */}
      <div className="bg-black/70 backdrop-blur-md rounded-xl p-2.5 border border-white/10 shadow-2xl flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex justify-between items-center text-[11px] font-bold tracking-wide text-slate-300">
          <span className="flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>PENGUASAAN WILAYAH</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            100% Wilayah = Menang Mutlak
          </span>
        </div>

        {/* Progress Bar Multi-Warna */}
        <div className="h-4 w-full bg-slate-900/90 rounded-md overflow-hidden flex border border-white/10 shadow-inner">
          <div
            style={{ width: `${skor.persentaseWilayah.hijau}%` }}
            className="bg-emerald-500 transition-all duration-300 relative group flex items-center justify-center text-[9px] font-black text-black overflow-hidden"
            title={`Hijau: ${skor.persentaseWilayah.hijau}%`}
          >
            {skor.persentaseWilayah.hijau >= 8 && `${skor.persentaseWilayah.hijau}%`}
          </div>
          <div
            style={{ width: `${skor.persentaseWilayah.kuning}%` }}
            className="bg-amber-400 transition-all duration-300 relative group flex items-center justify-center text-[9px] font-black text-black overflow-hidden"
            title={`Kuning: ${skor.persentaseWilayah.kuning}%`}
          >
            {skor.persentaseWilayah.kuning >= 8 && `${skor.persentaseWilayah.kuning}%`}
          </div>
          <div
            style={{ width: `${skor.persentaseWilayah.biru}%` }}
            className="bg-blue-500 transition-all duration-300 relative group flex items-center justify-center text-[9px] font-black text-white overflow-hidden"
            title={`Biru: ${skor.persentaseWilayah.biru}%`}
          >
            {skor.persentaseWilayah.biru >= 8 && `${skor.persentaseWilayah.biru}%`}
          </div>
          <div
            style={{ width: `${skor.persentaseWilayah.monster}%` }}
            className="bg-rose-600 transition-all duration-300 relative group flex items-center justify-center text-[9px] font-black text-white overflow-hidden"
            title={`Monster: ${skor.persentaseWilayah.monster}%`}
          >
            {skor.persentaseWilayah.monster >= 8 && `${skor.persentaseWilayah.monster}%`}
          </div>
        </div>

        {/* Rincian Skor 4 Kerajaan */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {/* Hijau */}
          <div className="flex flex-col bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-1.5 text-center">
            <div className="text-[10px] font-extrabold text-emerald-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              HIJAU
            </div>
            <div className="text-base font-black text-emerald-300 leading-tight">
              {skor.persentaseWilayah.hijau}%
            </div>
            <div className="text-[9px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
              <span title="Jumlah Markas" className="flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                {skor.jumlahMarkas.hijau}
              </span>
              <span title="Total Unit" className="flex items-center gap-0.5">
                <Swords className="w-2.5 h-2.5 text-slate-400" />
                {skor.jumlahPrajurit.hijau + skor.jumlahKsatria.hijau}
              </span>
            </div>
          </div>

          {/* Kuning */}
          <div className="flex flex-col bg-amber-950/40 border border-amber-500/30 rounded-lg p-1.5 text-center">
            <div className="text-[10px] font-extrabold text-amber-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              KUNING
            </div>
            <div className="text-base font-black text-amber-300 leading-tight">
              {skor.persentaseWilayah.kuning}%
            </div>
            <div className="text-[9px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
              <span title="Jumlah Markas" className="flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-amber-400" />
                {skor.jumlahMarkas.kuning}
              </span>
              <span title="Total Unit" className="flex items-center gap-0.5">
                <Swords className="w-2.5 h-2.5 text-slate-400" />
                {skor.jumlahPrajurit.kuning + skor.jumlahKsatria.kuning}
              </span>
            </div>
          </div>

          {/* Biru */}
          <div className="flex flex-col bg-blue-950/40 border border-blue-500/30 rounded-lg p-1.5 text-center">
            <div className="text-[10px] font-extrabold text-blue-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              BIRU
            </div>
            <div className="text-base font-black text-blue-300 leading-tight">
              {skor.persentaseWilayah.biru}%
            </div>
            <div className="text-[9px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
              <span title="Jumlah Markas" className="flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                {skor.jumlahMarkas.biru}
              </span>
              <span title="Total Unit" className="flex items-center gap-0.5">
                <Swords className="w-2.5 h-2.5 text-slate-400" />
                {skor.jumlahPrajurit.biru + skor.jumlahKsatria.biru}
              </span>
            </div>
          </div>

          {/* Monster */}
          <div className="flex flex-col bg-rose-950/40 border border-rose-500/30 rounded-lg p-1.5 text-center">
            <div className="text-[10px] font-extrabold text-rose-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              MONSTER
            </div>
            <div className="text-base font-black text-rose-300 leading-tight">
              {skor.persentaseWilayah.monster}%
            </div>
            <div className="text-[9px] text-slate-300 flex items-center justify-center gap-2 mt-0.5">
              <span title="Jumlah Markas" className="flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-rose-400" />
                {skor.jumlahMarkas.monster}
              </span>
              <span title="Total Unit" className="flex items-center gap-0.5">
                <Swords className="w-2.5 h-2.5 text-slate-400" />
                {skor.jumlahPrajurit.monster + skor.jumlahKsatria.monster}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
