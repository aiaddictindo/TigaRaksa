'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GameEngine } from '@/lib/gameEngine';
import { GameCanvas } from '@/components/GameCanvas';
import { ScoreboardOverlay } from '@/components/ScoreboardOverlay';
import { LiveEventTicker } from '@/components/LiveEventTicker';
import { GameMasterControls } from '@/components/GameMasterControls';
import { TikTokConnectModal } from '@/components/TikTokConnectModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { useTikTokSocket } from '@/hooks/useTikTokSocket';
import {
  FaseGame,
  FraksiKerajaan,
  RiwayatKemenangan,
  StatistikSkor,
  TipeUnit,
  VariasiMonster
} from '@/lib/gameTypes';
import { soundEffects } from '@/lib/soundEffects';

export default function HomePage() {
  // Instansiasi GameEngine yang stabil menggunakan lazy state initializer
  const [engine] = useState(() => new GameEngine());

  // React State untuk UI HUD
  const [fase, setFase] = useState<FaseGame>('persiapan');
  const [waktuSisa, setWaktuSisa] = useState<number>(12);
  const [skor, setSkor] = useState<StatistikSkor>(() => ({
    persentaseWilayah: { hijau: 25, kuning: 25, biru: 25, monster: 25 },
    jumlahMarkas: { hijau: 1, kuning: 1, biru: 1, monster: 1 },
    jumlahPrajurit: { hijau: 0, kuning: 0, biru: 0, monster: 0 },
    jumlahKsatria: { hijau: 0, kuning: 0, biru: 0, monster: 0 },
    totalKill: { hijau: 0, kuning: 0, biru: 0, monster: 0 }
  }));
  const [isSoundActive, setIsSoundActive] = useState<boolean>(true);
  const [isKoneksiModalOpen, setIsKoneksiModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [pemenang, setPemenang] = useState<FraksiKerajaan | null>(null);
  const [alasanMenang, setAlasanMenang] = useState<'mutlak' | 'waktu_habis' | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatKemenangan[]>([]);

  // Callbacks dari Engine ke React State
  useEffect(() => {
    engine.setCallbacks(
      // On Game End
      (juara, alasan) => {
        setPemenang(juara);
        setAlasanMenang(alasan);
        setIsLeaderboardOpen(true);

        const waktuStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });

        setRiwayat((prev) => [
          {
            id: `win-${Date.now()}`,
            pemenang: juara,
            alasan,
            persentaseAkhir: engine.skor.persentaseWilayah[juara],
            durasiDetik: Math.round(engine.totalDetikBerjalan),
            waktuSelesai: waktuStr
          },
          ...prev
        ]);
      },
      // On Phase Change
      (faseBaru) => {
        setFase(faseBaru);
      },
      // On Score Update
      (skorBaru) => {
        setSkor(skorBaru);
      }
    );
  }, [engine]);

  // Sinkronisasi Timer berkala untuk HUD
  useEffect(() => {
    const interval = setInterval(() => {
      setWaktuSisa(engine.waktuSisa);
      setFase(engine.fase);
    }, 200);

    return () => clearInterval(interval);
  }, [engine]);

  // Handler Aksi Spawn dari Socket & GM
  const handleSpawnPrajurit = useCallback(
    (fraksi: FraksiKerajaan, pengirim: string) => {
      engine.spawnPrajurit(fraksi, pengirim);
    },
    [engine]
  );

  const handleSpawnKsatria = useCallback(
    (fraksi: FraksiKerajaan, pengirim: string) => {
      engine.spawnKsatria(fraksi, pengirim);
    },
    [engine]
  );

  const handleSpawnKsatriaPengecut = useCallback(
    (fraksi: FraksiKerajaan, pengirim: string) => {
      engine.spawnKsatria(fraksi, pengirim, true);
    },
    [engine]
  );

  const handleSpawnMonster = useCallback(
    (tipe: TipeUnit, pengirim: string, variasi?: VariasiMonster, jumlah?: number) => {
      engine.spawnMonster(tipe, pengirim, variasi || 'standar', jumlah || 1);
    },
    [engine]
  );

  const handleTambahMarkas = useCallback(
    (fraksi: FraksiKerajaan, pengirim: string) => {
      engine.tambahMarkas(fraksi, pengirim);
    },
    [engine]
  );

  // Hook TikTok Socket.IO
  const {
    statusKoneksi,
    currentUsername,
    pesanStatus,
    daftarLog,
    isSocketServerOnline,
    hubungkanTikTok,
    putuskanTikTok,
    kirimSimulasiEvent
  } = useTikTokSocket({
    onSpawnPrajurit: handleSpawnPrajurit,
    onSpawnMonster: handleSpawnMonster,
    onSpawnKsatria: handleSpawnKsatria,
    onTambahMarkas: handleTambahMarkas
  });

  const handleToggleSound = () => {
    const nextVal = !isSoundActive;
    setIsSoundActive(nextVal);
    soundEffects.setEnabled(nextVal);
  };

  const handleMulaiUlangGame = () => {
    engine.inisialisasiGame();
    setFase('persiapan');
    setWaktuSisa(12);
    setSkor(engine.skor);
    setPemenang(null);
    setAlasanMenang(null);
    setIsLeaderboardOpen(false);
  };

  return (
    <main className="relative w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* FRAME UTAMA PORTRAIT (9:16) */}
      <div className="relative w-full h-full max-w-[480px] max-h-[960px] aspect-[9/16] bg-black shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border border-white/10 sm:rounded-2xl">
        {/* Canvas HTML5 Game Loop */}
        <GameCanvas engine={engine} />

        {/* Overlay HUD Papan Skor, Timer & Status */}
        <ScoreboardOverlay
          fase={fase}
          waktuSisa={waktuSisa}
          skor={skor}
          isSoundActive={isSoundActive}
          onToggleSound={handleToggleSound}
          onBukaKoneksi={() => setIsKoneksiModalOpen(true)}
          statusKoneksi={statusKoneksi}
          tiktokUsername={currentUsername}
        />

        {/* Ticker Aksi Live TikTok */}
        <LiveEventTicker logs={daftarLog} />

        {/* Panel Kontrol Pintasan Keyboard Game Master */}
        <GameMasterControls
          onSpawnPrajurit={handleSpawnPrajurit}
          onSpawnKsatria={handleSpawnKsatria}
          onSpawnKsatriaPengecut={handleSpawnKsatriaPengecut}
          onSpawnMonster={handleSpawnMonster}
          onTambahMarkas={handleTambahMarkas}
        />

        {/* Modal Hubungkan TikTok */}
        <TikTokConnectModal
          isOpen={isKoneksiModalOpen}
          onClose={() => setIsKoneksiModalOpen(false)}
          onConnect={hubungkanTikTok}
          onDisconnect={putuskanTikTok}
          statusKoneksi={statusKoneksi}
          currentUsername={currentUsername}
          pesanStatus={pesanStatus}
          isSocketServerOnline={isSocketServerOnline}
          onSimulasiEvent={kirimSimulasiEvent}
        />

        {/* Modal Papan Pemenang / Leaderboard saat Selesai */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          pemenang={pemenang}
          alasanMenang={alasanMenang}
          skor={skor}
          riwayat={riwayat}
          onMulaiUlang={handleMulaiUlangGame}
        />
      </div>
    </main>
  );
}
