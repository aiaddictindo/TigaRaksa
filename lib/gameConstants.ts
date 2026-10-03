/**
 * TIGA KERAJAAN VS MONSTER - KONSTANTA & KONFIGURASI
 */

import { FraksiKerajaan, InfoFraksi } from './gameTypes';

export const CANVAS_VIRTUAL_WIDTH = 720;
export const CANVAS_VIRTUAL_HEIGHT = 1280;

export const DURASI_FASE_PERSIAPAN = 12; // 12 detik
export const DURASI_FASE_PERTARUNGAN = 300; // 5 menit (300 detik)

export const DATA_FRAKSI: Record<FraksiKerajaan, InfoFraksi> = {
  hijau: {
    id: 'hijau',
    nama: 'Kerajaan Zamrud Hijau',
    gelar: 'Pasukan Pedang Hijau',
    warnaUtama: '#10B981',
    warnaSekunder: '#047857',
    warnaCahaya: '#34D399',
    warnaAura: 'rgba(16, 185, 129, 0.28)',
    pusatX: 250,
    pusatY: 520,
    radiusWilayah: 230
  },
  kuning: {
    id: 'kuning',
    nama: 'Kerajaan Surya Emas',
    gelar: 'Ksatria Surya Kuning',
    warnaUtama: '#F59E0B',
    warnaSekunder: '#B45309',
    warnaCahaya: '#FCD34D',
    warnaAura: 'rgba(245, 158, 11, 0.28)',
    pusatX: 470,
    pusatY: 520,
    radiusWilayah: 230
  },
  biru: {
    id: 'biru',
    nama: 'Kerajaan Samudera Biru',
    gelar: 'Penjaga Badai Biru',
    warnaUtama: '#3B82F6',
    warnaSekunder: '#1D4ED8',
    warnaCahaya: '#93C5FD',
    warnaAura: 'rgba(59, 130, 246, 0.28)',
    pusatX: 360,
    pusatY: 780,
    radiusWilayah: 230
  },
  monster: {
    id: 'monster',
    nama: 'Legiun Monster Merah',
    gelar: 'Monster Kegelapan Abyss',
    warnaUtama: '#EF4444',
    warnaSekunder: '#991B1B',
    warnaCahaya: '#FCA5A5',
    warnaAura: 'rgba(239, 68, 68, 0.35)',
    pusatX: 360,
    pusatY: 640,
    radiusWilayah: 120
  }
};

export const POSISI_AWAL_MARKAS: Record<FraksiKerajaan, { x: number; y: number }[]> = {
  hijau: [
    { x: 190, y: 440 }
  ],
  kuning: [
    { x: 530, y: 440 }
  ],
  biru: [
    { x: 360, y: 880 }
  ],
  monster: [
    { x: 360, y: 640 }
  ]
};

export const HP_MARKAS = 10000;

// Pengaturan Unit sesuai Permintaan
export const STAT_UNIT = {
  prajurit: {
    hp: 10,
    atk: 1,
    kecepatan: 1.25, // 1x
    radius: 9,
    cooldownSerang: 45 // frames (~0.75s)
  },
  ksatria: {
    hp: 100,
    atk: 5,
    kecepatan: 2.5, // 2x
    radius: 17,
    cooldownSerang: 30 // frames (~0.5s)
  },
  ksatriaPengecut: {
    hp: 80,
    atk: 1, // Attack terbalik (sangat lemah)
    kecepatan: 3.6, // Speed terbalik (super cepat!)
    radius: 15,
    cooldownSerang: 50
  }
};
