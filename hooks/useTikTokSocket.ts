'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EventTikTokLog, FraksiKerajaan, TipeUnit, VariasiMonster } from '@/lib/gameTypes';

export interface UseTikTokSocketProps {
  onSpawnPrajurit?: (fraksi: FraksiKerajaan, pengirim: string) => void;
  onSpawnMonster?: (tipe: TipeUnit, pengirim: string, variasi?: VariasiMonster, jumlah?: number) => void;
  onSpawnKsatria?: (fraksi: FraksiKerajaan, pengirim: string) => void;
  onTambahMarkas?: (fraksi: FraksiKerajaan, pengirim: string) => void;
}

export function useTikTokSocket({
  onSpawnPrajurit,
  onSpawnMonster,
  onSpawnKsatria,
  onTambahMarkas
}: UseTikTokSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [statusKoneksi, setStatusKoneksi] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [pesanStatus, setPesanStatus] = useState<string>('Siap menghubungkan ke TikTok Live.');
  const [daftarLog, setDaftarLog] = useState<EventTikTokLog[]>([]);
  const [isSocketServerOnline, setIsSocketServerOnline] = useState<boolean>(false);

  const tambahLog = useCallback((log: Omit<EventTikTokLog, 'id' | 'waktu'>) => {
    const waktuSekarang = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const entriBaru: EventTikTokLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      waktu: waktuSekarang,
      ...log
    };
    setDaftarLog((prev) => [entriBaru, ...prev.slice(0, 24)]);
  }, []);

  // Hubungkan ke Socket.IO server
  useEffect(() => {
    const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      timeout: 5000,
      autoConnect: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO terhubung ke backend server');
      setIsSocketServerOnline(true);
      tambahLog({
        tipe: 'sistem',
        pesan: 'Socket.IO terhubung ke Server Node.js.',
        pengirim: 'Sistem'
      });
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket.IO terputus dari backend');
      setIsSocketServerOnline(false);
    });

    socket.on('tiktok_status', (data: { status: 'connected' | 'connecting' | 'disconnected' | 'error'; username?: string; pesan?: string }) => {
      setStatusKoneksi(data.status);
      if (data.username !== undefined) setCurrentUsername(data.username);
      if (data.pesan) setPesanStatus(data.pesan);

      if (data.status === 'connected') {
        tambahLog({
          tipe: 'sistem',
          pesan: `Tersambung ke siaran TikTok @${data.username}`,
          pengirim: 'TikTok Live'
        });
      }
    });

    socket.on('tiktok_error', (data: { pesan: string }) => {
      setStatusKoneksi('error');
      setPesanStatus(data.pesan || 'Terjadi kesalahan pada koneksi TikTok.');
      tambahLog({
        tipe: 'sistem',
        pesan: `Gagal: ${data.pesan}`,
        pengirim: 'TikTok Live'
      });
    });

    // Menerima Aksi Game dari Server
    socket.on('aksi_game', (aksi: {
      tipe: string;
      fraksi?: FraksiKerajaan;
      pengirim?: string;
      username?: string;
      komentar?: string;
      jumlah?: number;
      namaGift?: string;
      koin?: number;
      variasi?: VariasiMonster;
      tipeUnit?: TipeUnit;
    }) => {
      const namaUser = aksi.pengirim || aksi.username || 'Penonton';

      switch (aksi.tipe) {
        case 'spawn_prajurit_chat':
          if (aksi.fraksi && onSpawnPrajurit) {
            onSpawnPrajurit(aksi.fraksi, namaUser);
            const namaFraksi = aksi.fraksi === 'hijau' ? 'Hijau' : aksi.fraksi === 'kuning' ? 'Kuning' : 'Biru';
            tambahLog({
              tipe: 'chat',
              fraksi: aksi.fraksi,
              pesan: `Komentar "${aksi.komentar}" → Prajurit ${namaFraksi}`,
              pengirim: namaUser
            });
          }
          break;

        case 'spawn_monster_like':
          if (onSpawnMonster) {
            const jml = aksi.jumlah || 1;
            onSpawnMonster('prajurit', namaUser, 'standar', jml);
            tambahLog({
              tipe: 'like',
              fraksi: 'monster',
              pesan: `Tap-tap Like (${jml}x) → Monster Merah`,
              pengirim: namaUser
            });
          }
          break;

        case 'tambah_markas_follow':
          if (onTambahMarkas) {
            onTambahMarkas('monster', namaUser);
            tambahLog({
              tipe: 'follow',
              fraksi: 'monster',
              pesan: `Follow Baru → +1 Markas Monster Merah!`,
              pengirim: namaUser
            });
          }
          break;

        case 'spawn_ksatria_gift':
          if (aksi.fraksi && onSpawnKsatria) {
            onSpawnKsatria(aksi.fraksi, namaUser);
            tambahLog({
              tipe: 'gift',
              fraksi: aksi.fraksi,
              pesan: `Kirim ${aksi.namaGift} (${aksi.koin || 1} koin) → Ksatria ${aksi.fraksi.toUpperCase()}!`,
              pengirim: namaUser
            });
          }
          break;

        case 'tambah_markas_gift_mahal':
          if (aksi.fraksi && onTambahMarkas) {
            onTambahMarkas(aksi.fraksi, namaUser);
            tambahLog({
              tipe: 'gift',
              fraksi: aksi.fraksi,
              pesan: `Kirim Hadiah Sultan (${aksi.koin} koin) → +1 Markas ${aksi.fraksi.toUpperCase()}!`,
              pengirim: namaUser
            });
          }
          break;

        case 'gm_spawn_unit':
          if (aksi.tipeUnit === 'ksatria' && aksi.fraksi && onSpawnKsatria) {
            onSpawnKsatria(aksi.fraksi, 'Game Master');
          } else if (aksi.fraksi === 'monster' && onSpawnMonster) {
            onSpawnMonster(aksi.tipeUnit || 'prajurit', 'Game Master', aksi.variasi || 'standar', 1);
          } else if (aksi.fraksi && onSpawnPrajurit) {
            onSpawnPrajurit(aksi.fraksi, 'Game Master');
          }
          break;

        case 'gm_tambah_markas':
          if (aksi.fraksi && onTambahMarkas) {
            onTambahMarkas(aksi.fraksi, 'Game Master');
          }
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [onSpawnPrajurit, onSpawnMonster, onSpawnKsatria, onTambahMarkas, tambahLog]);

  /**
   * Mengirim permintaan menghubungkan username TikTok
   */
  const hubungkanTikTok = useCallback((username: string) => {
    if (!username.trim()) return;
    setStatusKoneksi('connecting');
    setPesanStatus(`Menghubungkan ke @${username}...`);

    if (socketRef.current && isSocketServerOnline) {
      socketRef.current.emit('hubungkan_tiktok', { username });
    } else {
      // Jika socket offline atau mode demo lokal, simulasikan status terhubung
      setTimeout(() => {
        setStatusKoneksi('connected');
        setCurrentUsername(username);
        setPesanStatus(`Mode Langsung: @${username}`);
        tambahLog({
          tipe: 'sistem',
          pesan: `Tersambung ke kanal @${username} (Simulator Siap)`,
          pengirim: 'Sistem'
        });
      }, 1000);
    }
  }, [isSocketServerOnline, tambahLog]);

  /**
   * Memutuskan koneksi TikTok
   */
  const putuskanTikTok = useCallback(() => {
    if (socketRef.current && isSocketServerOnline) {
      socketRef.current.emit('putuskan_tiktok');
    }
    setStatusKoneksi('disconnected');
    setCurrentUsername('');
    setPesanStatus('Koneksi TikTok diputuskan.');
  }, [isSocketServerOnline]);

  /**
   * Memicu Simulasi Event TikTok (Chat, Like, Gift, Follow)
   */
  const kirimSimulasiEvent = useCallback((payload: {
    tipe: string;
    fraksi?: FraksiKerajaan;
    pengirim?: string;
    komentar?: string;
    jumlah?: number;
    namaGift?: string;
    koin?: number;
    variasi?: VariasiMonster;
    tipeUnit?: TipeUnit;
  }) => {
    if (socketRef.current && isSocketServerOnline) {
      socketRef.current.emit('simulasi_event_tiktok', payload);
    } else {
      // Eksekusi langsung jika socket offline
      const user = payload.pengirim || 'Penonton Simulasi';
      if (payload.tipe === 'spawn_prajurit_chat' && payload.fraksi && onSpawnPrajurit) {
        onSpawnPrajurit(payload.fraksi, user);
        tambahLog({
          tipe: 'chat',
          fraksi: payload.fraksi,
          pesan: `Komentar "${payload.komentar}" → Prajurit ${payload.fraksi.toUpperCase()}`,
          pengirim: user
        });
      } else if (payload.tipe === 'spawn_monster_like' && onSpawnMonster) {
        const jml = payload.jumlah || 1;
        onSpawnMonster('prajurit', user, 'standar', jml);
        tambahLog({
          tipe: 'like',
          fraksi: 'monster',
          pesan: `Like ${jml}x → Monster Merah`,
          pengirim: user
        });
      } else if (payload.tipe === 'tambah_markas_follow' && onTambahMarkas) {
        onTambahMarkas('monster', user);
        tambahLog({
          tipe: 'follow',
          fraksi: 'monster',
          pesan: `Follow Baru → +1 Markas Monster`,
          pengirim: user
        });
      } else if (payload.tipe === 'spawn_ksatria_gift' && payload.fraksi && onSpawnKsatria) {
        onSpawnKsatria(payload.fraksi, user);
        tambahLog({
          tipe: 'gift',
          fraksi: payload.fraksi,
          pesan: `Gift ${payload.namaGift} → Ksatria ${payload.fraksi.toUpperCase()}!`,
          pengirim: user
        });
      } else if (payload.tipe === 'tambah_markas_gift_mahal' && payload.fraksi && onTambahMarkas) {
        onTambahMarkas(payload.fraksi, user);
        tambahLog({
          tipe: 'gift',
          fraksi: payload.fraksi,
          pesan: `Gift Sultan (${payload.koin} koin) → +1 Markas ${payload.fraksi.toUpperCase()}!`,
          pengirim: user
        });
      }
    }
  }, [isSocketServerOnline, onSpawnPrajurit, onSpawnMonster, onSpawnKsatria, onTambahMarkas, tambahLog]);

  return {
    statusKoneksi,
    currentUsername,
    pesanStatus,
    daftarLog,
    isSocketServerOnline,
    hubungkanTikTok,
    putuskanTikTok,
    kirimSimulasiEvent,
    tambahLog
  };
}
