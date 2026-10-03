'use client';

import React, { useEffect, useState } from 'react';
import { FraksiKerajaan, TipeUnit, VariasiMonster } from '@/lib/gameTypes';
import { Terminal, ChevronUp, ChevronDown, Flame, Shield, Swords, Sparkles } from 'lucide-react';

interface GameMasterControlsProps {
  onSpawnPrajurit: (fraksi: FraksiKerajaan, pengirim: string) => void;
  onSpawnKsatria: (fraksi: FraksiKerajaan, pengirim: string) => void;
  onSpawnKsatriaPengecut?: (fraksi: FraksiKerajaan, pengirim: string) => void;
  onSpawnMonster: (tipe: TipeUnit, pengirim: string, variasi?: VariasiMonster, jumlah?: number) => void;
  onTambahMarkas: (fraksi: FraksiKerajaan, pengirim: string) => void;
}

export const GameMasterControls: React.FC<GameMasterControlsProps> = ({
  onSpawnPrajurit,
  onSpawnKsatria,
  onSpawnKsatriaPengecut,
  onSpawnMonster,
  onTambahMarkas
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Keyboard Event Listener untuk Game Master
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika user sedang mengetik di input form
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      setLastKeyPressed(key);
      setTimeout(() => setLastKeyPressed(null), 400);

      switch (key) {
        // PRAJURIT BIASA (1, 2, 3, 4)
        case '1':
          onSpawnPrajurit('hijau', 'GM [1]');
          break;
        case '2':
          onSpawnPrajurit('kuning', 'GM [2]');
          break;
        case '3':
          onSpawnPrajurit('biru', 'GM [3]');
          break;
        case '4':
          onSpawnMonster('prajurit', 'GM [4]', 'standar', 1);
          break;

        // KSATRIA KUAT (Q, W, E, R)
        case 'Q':
          onSpawnKsatria('hijau', 'GM [Q]');
          break;
        case 'W':
          onSpawnKsatria('kuning', 'GM [W]');
          break;
        case 'E':
          onSpawnKsatria('biru', 'GM [E]');
          break;
        case 'R':
          onSpawnMonster('ksatria', 'GM [R]', 'standar', 1);
          break;

        // VARIASI MONSTER MERAH (T, Y, U, I, O, P)
        case 'T':
          onSpawnMonster('prajurit', 'GM [T]', 'gorgon', 1);
          break;
        case 'Y':
          onSpawnMonster('prajurit', 'GM [Y]', 'naga', 1);
          break;
        case 'U':
          onSpawnMonster('prajurit', 'GM [U]', 'raksasa', 1);
          break;
        case 'I':
          onSpawnMonster('prajurit', 'GM [I]', 'bayangan', 1);
          break;
        case 'O':
          onSpawnMonster('prajurit', 'GM [O]', 'magma', 1);
          break;
        case 'P':
          onSpawnMonster('ksatria', 'GM [P]', 'primordial', 1);
          break;

        // TAMBAH MARKAS (A, S, D, F)
        case 'A':
          onTambahMarkas('hijau', 'GM [A]');
          break;
        case 'S':
          onTambahMarkas('kuning', 'GM [S]');
          break;
        case 'D':
          onTambahMarkas('biru', 'GM [D]');
          break;
        case 'F':
          onTambahMarkas('monster', 'GM [F]');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSpawnPrajurit, onSpawnKsatria, onSpawnMonster, onTambahMarkas]);

  return (
    <div className="absolute bottom-2 left-2 right-2 z-40 flex flex-col items-center">
      {/* Tombol Buka/Tutup Drawer Game Master */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition active:scale-95 mb-1"
      >
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span>Panel Game Master (Pintasan Keyboard)</span>
        {lastKeyPressed && (
          <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-black rounded animate-ping">
            {lastKeyPressed}
          </span>
        )}
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Konten Menu Game Master saat Terbuka */}
      {isOpen && (
        <div className="w-full max-w-md bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 animate-fadeIn text-white text-xs max-h-72 overflow-y-auto">
          {/* Bagian 1: Spawn Prajurit Biasa */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Swords className="w-3 h-3 text-emerald-400" />
              <span>Prajurit Biasa (Tekan Angka 1-4)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onSpawnPrajurit('hijau', 'GM')}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-emerald-400 text-xs">[1]</span>
                <span className="text-[10px] text-emerald-200">Prajurit Hijau</span>
              </button>
              <button
                onClick={() => onSpawnPrajurit('kuning', 'GM')}
                className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-amber-400 text-xs">[2]</span>
                <span className="text-[10px] text-amber-200">Prajurit Kuning</span>
              </button>
              <button
                onClick={() => onSpawnPrajurit('biru', 'GM')}
                className="bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-blue-400 text-xs">[3]</span>
                <span className="text-[10px] text-blue-200">Prajurit Biru</span>
              </button>
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'standar', 1)}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-rose-400 text-xs">[4]</span>
                <span className="text-[10px] text-rose-200">Monster Merah</span>
              </button>
            </div>
          </div>

          {/* Bagian 2: Spawn Ksatria Kuat */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ksatria Kuat / Monster Elit (Tekan Q, W, E, R)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onSpawnKsatria('hijau', 'GM')}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-emerald-300 text-xs">[Q]</span>
                <span className="text-[10px] text-emerald-100 font-bold">Ksatria Hijau</span>
              </button>
              <button
                onClick={() => onSpawnKsatria('kuning', 'GM')}
                className="bg-amber-950/80 hover:bg-amber-900 border border-amber-400 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-amber-300 text-xs">[W]</span>
                <span className="text-[10px] text-amber-100 font-bold">Ksatria Kuning</span>
              </button>
              <button
                onClick={() => onSpawnKsatria('biru', 'GM')}
                className="bg-blue-950/80 hover:bg-blue-900 border border-blue-400 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-blue-300 text-xs">[E]</span>
                <span className="text-[10px] text-blue-100 font-bold">Ksatria Biru</span>
              </button>
              <button
                onClick={() => onSpawnMonster('ksatria', 'GM', 'standar', 1)}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-400 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-rose-300 text-xs">[R]</span>
                <span className="text-[10px] text-rose-100 font-bold">Monster Kuat</span>
              </button>
            </div>
          </div>

          {/* Bagian Baru: Ksatria Pengecut (Lucu & Unik) */}
          {onSpawnKsatriaPengecut && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>😱🏃💨</span>
                  <span>Ksatria Pengecut (Kabur & Rebut Wilayah Cepat!)</span>
                </span>
                <span className="text-[9px] text-amber-400 font-normal">Speed 3.6x • ATK 1</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onSpawnKsatriaPengecut('hijau', 'GM')}
                  className="bg-emerald-950/50 hover:bg-emerald-900 border border-amber-400/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
                >
                  <span className="text-xs">🏃💨</span>
                  <span className="text-[10px] text-emerald-300 font-bold">Pengecut Hijau</span>
                </button>
                <button
                  onClick={() => onSpawnKsatriaPengecut('kuning', 'GM')}
                  className="bg-amber-950/50 hover:bg-amber-900 border border-amber-400/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
                >
                  <span className="text-xs">🏃💨</span>
                  <span className="text-[10px] text-amber-300 font-bold">Pengecut Kuning</span>
                </button>
                <button
                  onClick={() => onSpawnKsatriaPengecut('biru', 'GM')}
                  className="bg-blue-950/50 hover:bg-blue-900 border border-amber-400/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
                >
                  <span className="text-xs">🏃💨</span>
                  <span className="text-[10px] text-blue-300 font-bold">Pengecut Biru</span>
                </button>
              </div>
            </div>
          )}

          {/* Bagian 3: Variasi Monster Merah (T, Y, U, I, O, P) */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Variasi Visual Monster (Tekan T, Y, U, I, O, P)</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'gorgon', 1)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Gorgon Berduri"
              >
                <span className="font-mono font-black text-rose-300 text-[11px]">[T]</span>
                <span className="text-[8px] text-rose-200">Gorgon</span>
              </button>
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'naga', 1)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Naga Api"
              >
                <span className="font-mono font-black text-rose-300 text-[11px]">[Y]</span>
                <span className="text-[8px] text-rose-200">Naga</span>
              </button>
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'raksasa', 1)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Raksasa Besi"
              >
                <span className="font-mono font-black text-rose-300 text-[11px]">[U]</span>
                <span className="text-[8px] text-rose-200">Raksasa</span>
              </button>
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'bayangan', 1)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Bayangan Heksagon"
              >
                <span className="font-mono font-black text-rose-300 text-[11px]">[I]</span>
                <span className="text-[8px] text-rose-200">Bayang</span>
              </button>
              <button
                onClick={() => onSpawnMonster('prajurit', 'GM', 'magma', 1)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Penjagal Magma"
              >
                <span className="font-mono font-black text-rose-300 text-[11px]">[O]</span>
                <span className="text-[8px] text-rose-200">Magma</span>
              </button>
              <button
                onClick={() => onSpawnMonster('ksatria', 'GM', 'primordial', 1)}
                className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500 p-1 rounded flex flex-col items-center transition active:scale-95"
                title="Raja Primordial Apex (HP 150)"
              >
                <span className="font-mono font-black text-amber-300 text-[11px]">[P]</span>
                <span className="text-[8px] text-amber-200 font-bold">Raja Apex</span>
              </button>
            </div>
          </div>

          {/* Bagian 4: Tambah Markas Kerajaan (A, S, D, F) */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Tambah Markas Benteng (Tekan A, S, D, F)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onTambahMarkas('hijau', 'GM')}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-emerald-400 text-xs">[A]</span>
                <span className="text-[10px] text-emerald-200">+ Markas Hijau</span>
              </button>
              <button
                onClick={() => onTambahMarkas('kuning', 'GM')}
                className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-amber-400 text-xs">[S]</span>
                <span className="text-[10px] text-amber-200">+ Markas Kuning</span>
              </button>
              <button
                onClick={() => onTambahMarkas('biru', 'GM')}
                className="bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-blue-400 text-xs">[D]</span>
                <span className="text-[10px] text-blue-200">+ Markas Biru</span>
              </button>
              <button
                onClick={() => onTambahMarkas('monster', 'GM')}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 p-1.5 rounded-lg flex flex-col items-center transition active:scale-95"
              >
                <span className="font-mono font-black text-rose-400 text-xs">[F]</span>
                <span className="text-[10px] text-rose-200">+ Markas Monster</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
