/**
 * TIGA KERAJAAN VS MONSTER - TIPE DATA & INTERFACES
 * Disesuaikan penuh dengan spesifikasi aturan game TikTok Live
 */

export type FraksiKerajaan = 'hijau' | 'kuning' | 'biru' | 'monster';

export type TipeUnit = 'prajurit' | 'ksatria';

export type VariasiMonster = 'standar' | 'gorgon' | 'naga' | 'raksasa' | 'bayangan' | 'magma' | 'primordial';

export interface InfoFraksi {
  id: FraksiKerajaan;
  nama: string;
  gelar: string;
  warnaUtama: string;
  warnaSekunder: string;
  warnaCahaya: string;
  warnaAura: string;
  pusatX: number;
  pusatY: number;
  radiusWilayah: number;
}

export interface UnitGame {
  id: string;
  fraksi: FraksiKerajaan;
  tipe: TipeUnit;
  subtipe?: 'standar' | 'pengecut'; // Ksatria pengecut yang kabur dan merebut teritorial
  isKabur?: boolean;
  chatKaburCooldown?: number;
  variasiMonster?: VariasiMonster;
  hp: number;
  maxHp: number;
  atk: number;
  kecepatan: number;
  radius: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  cooldownSerang: number;
  waktuLahir: number;
  namaPenyumbang?: string;
  sudutGerak: number;
}

export interface MarkasGame {
  id: string;
  fraksi: FraksiKerajaan;
  x: number;
  y: number;
  radius: number;
  hp: number;            // HP Markas (10000)
  maxHp: number;         // Max HP Markas (10000)
  timerPrajurit: number; // Tiap 5 detik spawn prajurit
  timerKsatria: number;  // Tiap 30 detik spawn ksatria
  totalSpawnPrajurit: number;
  totalSpawnKsatria: number;
  denyutAura: number;
}

export interface TitikWilayah {
  x: number;
  y: number;
  pemilik: FraksiKerajaan;
  pengaruh: Record<FraksiKerajaan, number>;
  radiusSektor: number;
}

export type FaseGame = 'persiapan' | 'pertarungan' | 'selesai';

export interface StatistikSkor {
  persentaseWilayah: Record<FraksiKerajaan, number>;
  jumlahMarkas: Record<FraksiKerajaan, number>;
  jumlahPrajurit: Record<FraksiKerajaan, number>;
  jumlahKsatria: Record<FraksiKerajaan, number>;
  totalKill: Record<FraksiKerajaan, number>;
}

export interface PartikelEfek {
  x: number;
  y: number;
  vx: number;
  vy: number;
  warna: string;
  ukuran: number;
  umur: number;
  maxUmur: number;
  bentuk?: 'lingkaran' | 'bintang' | 'percikan';
}

export interface TeksMelayang {
  id: string;
  x: number;
  y: number;
  teks: string;
  warna: string;
  ukuran: number;
  umur: number;
  maxUmur: number;
}

export interface EventTikTokLog {
  id: string;
  tipe: 'chat' | 'like' | 'follow' | 'gift' | 'sistem';
  fraksi?: FraksiKerajaan;
  pesan: string;
  pengirim: string;
  waktu: string;
  ikon?: string;
}

export interface RiwayatKemenangan {
  id: string;
  pemenang: FraksiKerajaan;
  alasan: 'mutlak' | 'waktu_habis';
  persentaseAkhir: number;
  durasiDetik: number;
  waktuSelesai: string;
}
