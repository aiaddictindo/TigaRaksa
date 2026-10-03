'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DATA_FRAKSI } from '@/lib/gameConstants';
import { FraksiKerajaan, RiwayatKemenangan, StatistikSkor } from '@/lib/gameTypes';
import { Trophy, RotateCcw, Shield, Swords, History } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  pemenang: FraksiKerajaan | null;
  alasanMenang: 'mutlak' | 'waktu_habis' | null;
  skor: StatistikSkor;
  riwayat: RiwayatKemenangan[];
  onMulaiUlang: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  pemenang,
  alasanMenang,
  skor,
  riwayat,
  onMulaiUlang
}) => {
  useEffect(() => {
    if (isOpen && pemenang) {
      const colors = pemenang === 'hijau'
        ? ['#10B981', '#34D399', '#059669', '#FFFFFF']
        : pemenang === 'kuning'
        ? ['#F59E0B', '#FCD34D', '#D97706', '#FFFFFF']
        : pemenang === 'biru'
        ? ['#3B82F6', '#93C5FD', '#1D4ED8', '#FFFFFF']
        : ['#EF4444', '#F87171', '#991B1B', '#FFFFFF'];

      // Tembakkan Confetti Kemenangan
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isOpen, pemenang]);

  if (!isOpen || !pemenang) return null;

  const infoPemenang = DATA_FRAKSI[pemenang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Banner Kemenangan */}
        <div
          style={{ backgroundColor: infoPemenang.warnaSekunder }}
          className="p-6 text-center relative overflow-hidden flex flex-col items-center border-b border-white/15"
        >
          {/* Latar Belakang Cahaya */}
          <div
            style={{ backgroundColor: infoPemenang.warnaCahaya }}
            className="absolute -top-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          />

          <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center shadow-xl mb-2.5">
            <Trophy className="w-9 h-9 text-amber-300 drop-shadow-md animate-bounce" />
          </div>

          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-200">
            HASIL AKHIR PERTANDINGAN
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide mt-1">
            PEMENANG: {infoPemenang.nama.toUpperCase()}
          </h2>
          <p className="text-xs text-white/90 font-medium mt-1">
            {alasanMenang === 'mutlak'
              ? '👑 MENANG MUTLAK! Menguasai 100% Wilayah'
              : `⏱️ WAKTU HABIS! Menguasai ${skor.persentaseWilayah[pemenang]}% Wilayah`}
          </p>
        </div>

        {/* Konten Statistik Skor & Leaderboard */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs text-slate-300">
          {/* Papan Skor Akhir 4 Kerajaan */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Papan Skor Wilayah Akhir</span>
              <span>Markas / Unit</span>
            </div>

            <div className="space-y-2">
              {(['hijau', 'kuning', 'biru', 'monster'] as FraksiKerajaan[]).map((f) => {
                const info = DATA_FRAKSI[f];
                const isWinner = f === pemenang;
                const pct = skor.persentaseWilayah[f];

                return (
                  <div
                    key={f}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                      isWinner
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: info.warnaUtama }}
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {info.nama}
                          {isWinner && <span className="text-xs">🏆</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {info.gelar}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-white">
                        {pct}%
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 justify-end">
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5 text-slate-400" />
                          {skor.jumlahMarkas[f]}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Swords className="w-2.5 h-2.5 text-slate-400" />
                          {skor.jumlahPrajurit[f] + skor.jumlahKsatria[f]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riwayat Juara Terdahulu */}
          {riwayat.length > 0 && (
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                <span>Riwayat Pertandingan Terakhir</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {riwayat.slice(0, 5).map((item, idx) => {
                  const info = DATA_FRAKSI[item.pemenang];
                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[10px]"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span
                          style={{ backgroundColor: info.warnaUtama }}
                          className="w-2 h-2 rounded-full"
                        />
                        <span>{info.nama}</span>
                      </div>
                      <div className="text-slate-400">
                        {item.alasan === 'mutlak' ? 'Menang Mutlak (100%)' : `Skor: ${item.persentaseAkhir}%`}
                        <span className="ml-1.5 text-slate-500 font-mono">({item.waktuSelesai})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Tombol Mulai Ulang */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
          <button
            onClick={onMulaiUlang}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-black" />
            <span>Mulai Ulang Pertandingan Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
