/**
 * TIGA KERAJAAN VS MONSTER - GAME ENGINE
 * Logika pertempuran, simulasi unit, penguasaan wilayah dinamis, dan rendering HTML5 Canvas 60FPS
 */

import {
  CANVAS_VIRTUAL_HEIGHT,
  CANVAS_VIRTUAL_WIDTH,
  DATA_FRAKSI,
  DURASI_FASE_PERSIAPAN,
  DURASI_FASE_PERTARUNGAN,
  HP_MARKAS,
  POSISI_AWAL_MARKAS,
  STAT_UNIT
} from './gameConstants';
import {
  FaseGame,
  FraksiKerajaan,
  MarkasGame,
  PartikelEfek,
  StatistikSkor,
  TeksMelayang,
  TipeUnit,
  TitikWilayah,
  UnitGame,
  VariasiMonster
} from './gameTypes';
import { soundEffects } from './soundEffects';

export class GameEngine {
  public fase: FaseGame = 'persiapan';
  public waktuSisa: number = DURASI_FASE_PERSIAPAN; // dalam detik
  public units: UnitGame[] = [];
  public bases: MarkasGame[] = [];
  public territoryPoints: TitikWilayah[] = [];
  public particles: PartikelEfek[] = [];
  public floatingTexts: TeksMelayang[] = [];

  public skor: StatistikSkor = {
    persentaseWilayah: { hijau: 25, kuning: 25, biru: 25, monster: 25 },
    jumlahMarkas: { hijau: 1, kuning: 1, biru: 1, monster: 1 },
    jumlahPrajurit: { hijau: 0, kuning: 0, biru: 0, monster: 0 },
    jumlahKsatria: { hijau: 0, kuning: 0, biru: 0, monster: 0 },
    totalKill: { hijau: 0, kuning: 0, biru: 0, monster: 0 }
  };

  public pemenang: FraksiKerajaan | null = null;
  public alasanMenang: 'mutlak' | 'waktu_habis' | null = null;
  public totalDetikBerjalan: number = 0;

  private onGameEndCallback?: (pemenang: FraksiKerajaan, alasan: 'mutlak' | 'waktu_habis') => void;
  private onPhaseChangeCallback?: (faseBaru: FaseGame) => void;
  private onScoreUpdateCallback?: (skor: StatistikSkor) => void;

  private frameCounter: number = 0;
  private lastTimestamp: number = 0;

  constructor() {
    this.inisialisasiGame();
  }

  public setCallbacks(
    onEnd: (pemenang: FraksiKerajaan, alasan: 'mutlak' | 'waktu_habis') => void,
    onPhase: (faseBaru: FaseGame) => void,
    onScore: (skor: StatistikSkor) => void
  ) {
    this.onGameEndCallback = onEnd;
    this.onPhaseChangeCallback = onPhase;
    this.onScoreUpdateCallback = onScore;
  }

  /**
   * Reset dan inisialisasi state awal permainan
   */
  public inisialisasiGame() {
    this.fase = 'persiapan';
    this.waktuSisa = DURASI_FASE_PERSIAPAN;
    this.units = [];
    this.bases = [];
    this.particles = [];
    this.floatingTexts = [];
    this.pemenang = null;
    this.alasanMenang = null;
    this.totalDetikBerjalan = 0;
    this.frameCounter = 0;

    // 1. Buat Markas Awal tiap kerajaan
    (['hijau', 'kuning', 'biru', 'monster'] as FraksiKerajaan[]).forEach((fraksi) => {
      const posAwal = POSISI_AWAL_MARKAS[fraksi][0];
      this.bases.push({
        id: `base-${fraksi}-0`,
        fraksi,
        x: posAwal.x,
        y: posAwal.y,
        radius: fraksi === 'monster' ? 32 : 30,
        hp: HP_MARKAS,
        maxHp: HP_MARKAS,
        timerPrajurit: 300, // 5 detik pertama
        timerKsatria: 1800,  // 30 detik pertama
        totalSpawnPrajurit: 0,
        totalSpawnKsatria: 0,
        denyutAura: 0
      });
    });

    // 2. Buat Titik Sampling Wilayah Diagram Venn
    this.buatTitikWilayah();

    // 3. Spawn beberapa prajurit awal agar visual peta hidup
    this.spawnPrajurit('hijau', 'Sistem', 2);
    this.spawnPrajurit('kuning', 'Sistem', 2);
    this.spawnPrajurit('biru', 'Sistem', 2);
    this.spawnMonster('prajurit', 'Sistem', 'standar', 2);

    this.updateStatistik();
  }

  /**
   * Mengatur grid titik wilayah di dalam 3 lingkaran Venn diagram
   */
  private buatTitikWilayah() {
    this.territoryPoints = [];
    const step = 34; // Kepadatan grid wilayah
    const padding = 40;

    for (let x = padding; x <= CANVAS_VIRTUAL_WIDTH - padding; x += step) {
      for (let y = 280; y <= 1020; y += step) {
        // Cek apakah (x, y) berada dalam salah satu dari 3 lingkaran Venn
        const dHijau = Math.hypot(x - DATA_FRAKSI.hijau.pusatX, y - DATA_FRAKSI.hijau.pusatY);
        const dKuning = Math.hypot(x - DATA_FRAKSI.kuning.pusatX, y - DATA_FRAKSI.kuning.pusatY);
        const dBiru = Math.hypot(x - DATA_FRAKSI.biru.pusatX, y - DATA_FRAKSI.biru.pusatY);

        const inHijau = dHijau <= DATA_FRAKSI.hijau.radiusWilayah;
        const inKuning = dKuning <= DATA_FRAKSI.kuning.radiusWilayah;
        const inBiru = dBiru <= DATA_FRAKSI.biru.radiusWilayah;

        if (inHijau || inKuning || inBiru) {
          // Tentukan kepemilikan awal
          let pemilikAwal: FraksiKerajaan = 'hijau';
          const dMonster = Math.hypot(x - DATA_FRAKSI.monster.pusatX, y - DATA_FRAKSI.monster.pusatY);

          // Jika berada di zona irisan tengah, miliki monster
          if (dMonster <= DATA_FRAKSI.monster.radiusWilayah || (inHijau && inKuning && inBiru)) {
            pemilikAwal = 'monster';
          } else {
            // Ambil lingkaran dengan jarak terdekat ke pusat
            const minD = Math.min(dHijau, dKuning, dBiru);
            if (minD === dHijau) pemilikAwal = 'hijau';
            else if (minD === dKuning) pemilikAwal = 'kuning';
            else pemilikAwal = 'biru';
          }

          this.territoryPoints.push({
            x,
            y,
            pemilik: pemilikAwal,
            pengaruh: {
              hijau: pemilikAwal === 'hijau' ? 100 : 0,
              kuning: pemilikAwal === 'kuning' ? 100 : 0,
              biru: pemilikAwal === 'biru' ? 100 : 0,
              monster: pemilikAwal === 'monster' ? 100 : 0
            },
            radiusSektor: step * 0.72
          });
        }
      }
    }
  }

  /**
   * Menambahkan Markas Baru untuk sebuah Fraksi
   */
  public tambahMarkas(fraksi: FraksiKerajaan, pengirim?: string) {
    const existing = this.bases.filter((b) => b.fraksi === fraksi);
    const count = existing.length;
    const info = DATA_FRAKSI[fraksi];

    // Posisi markas baru berputar mengitari pusat kerajaan
    const angle = (count * 1.4) + (Math.PI / 4);
    const distance = 80 + (count * 20);

    let newX = Math.round(info.pusatX + Math.cos(angle) * distance);
    let newY = Math.round(info.pusatY + Math.sin(angle) * distance);

    // Pastikan tetap berada di area peta yang valid
    newX = Math.max(80, Math.min(CANVAS_VIRTUAL_WIDTH - 80, newX));
    newY = Math.max(340, Math.min(CANVAS_VIRTUAL_HEIGHT - 240, newY));

    this.bases.push({
      id: `base-${fraksi}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      fraksi,
      x: newX,
      y: newY,
      radius: 28,
      hp: HP_MARKAS,
      maxHp: HP_MARKAS,
      timerPrajurit: 300,
      timerKsatria: 1800,
      totalSpawnPrajurit: 0,
      totalSpawnKsatria: 0,
      denyutAura: 0
    });

    soundEffects.playTambahMarkas();

    // Tambah efek partikel dan teks notifikasi
    this.buatPartikelLedakan(newX, newY, info.warnaCahaya, 35);
    this.tambahTeksMelayang(newX, newY - 20, `MARKAS BARU ${info.nama.toUpperCase()}!`, info.warnaCahaya, 16);

    this.updateStatistik();
  }

  /**
   * Menghitung jumlah markas yang dimiliki oleh fraksi tertentu
   */
  public getJumlahMarkas(fraksi: FraksiKerajaan): number {
    return this.bases.filter((b) => b.fraksi === fraksi).length || 1;
  }

  /**
   * Memunculkan Prajurit Kerajaan (Hijau / Kuning / Biru)
   * Aturan: Jumlah prajurit yang muncul = jumlah markas kerajaan tersebut
   * Spawn di arah yang acak (random angle & distance)
   */
  public spawnPrajurit(fraksi: FraksiKerajaan, pengirim: string = 'Penonton', jumlahManual?: number) {
    const markasFraksi = this.bases.filter((b) => b.fraksi === fraksi);
    if (markasFraksi.length === 0) return;

    // Sesuai Aturan: 1 komentar memunculkan prajurit sebanyak markas yang ada
    const jumlahMuncul = jumlahManual !== undefined ? jumlahManual : markasFraksi.length;

    for (let i = 0; i < jumlahMuncul; i++) {
      const baseDipakai = markasFraksi[i % markasFraksi.length];
      // Arah dan jarak acak mengitari markas (random angle)
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = 25 + Math.random() * 45;
      const spawnX = Math.max(60, Math.min(CANVAS_VIRTUAL_WIDTH - 60, baseDipakai.x + Math.cos(randomAngle) * randomDistance));
      const spawnY = Math.max(280, Math.min(1060, baseDipakai.y + Math.sin(randomAngle) * randomDistance));

      this.units.push({
        id: `unit-${fraksi}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fraksi,
        tipe: 'prajurit',
        subtipe: 'standar',
        hp: STAT_UNIT.prajurit.hp,
        maxHp: STAT_UNIT.prajurit.hp,
        atk: STAT_UNIT.prajurit.atk,
        kecepatan: STAT_UNIT.prajurit.kecepatan,
        radius: STAT_UNIT.prajurit.radius,
        x: spawnX,
        y: spawnY,
        cooldownSerang: Math.floor(Math.random() * 20),
        waktuLahir: Date.now(),
        namaPenyumbang: pengirim,
        sudutGerak: randomAngle
      });

      this.buatPartikelLedakan(spawnX, spawnY, DATA_FRAKSI[fraksi].warnaCahaya, 6);
    }

    soundEffects.playSpawnPrajurit(fraksi);
    this.updateStatistik();
  }

  /**
   * Memunculkan Ksatria Kerajaan (Mawar/GG/Kopi)
   * Terkadang memunculkan Ksatria Pengecut yang lari kencang & fokus merebut wilayah!
   */
  public spawnKsatria(
    fraksi: FraksiKerajaan,
    pengirim: string = 'Sultan Gift',
    paksaPengecut?: boolean
  ) {
    const markasFraksi = this.bases.filter((b) => b.fraksi === fraksi);
    const baseDipakai = markasFraksi.length > 0 
      ? markasFraksi[Math.floor(Math.random() * markasFraksi.length)] 
      : { x: DATA_FRAKSI[fraksi].pusatX, y: DATA_FRAKSI[fraksi].pusatY };

    // Peluang 25% menjadi Ksatria Pengecut (atau jika dipaksa dari tombol GM)
    const isPengecut = paksaPengecut !== undefined ? paksaPengecut : Math.random() < 0.28;

    // Arah acak saat muncul
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDistance = 25 + Math.random() * 40;
    const spawnX = Math.max(60, Math.min(CANVAS_VIRTUAL_WIDTH - 60, baseDipakai.x + Math.cos(randomAngle) * randomDistance));
    const spawnY = Math.max(280, Math.min(1060, baseDipakai.y + Math.sin(randomAngle) * randomDistance));

    const hp = isPengecut ? STAT_UNIT.ksatriaPengecut.hp : STAT_UNIT.ksatria.hp;
    const atk = isPengecut ? STAT_UNIT.ksatriaPengecut.atk : STAT_UNIT.ksatria.atk;
    const kecepatan = isPengecut ? STAT_UNIT.ksatriaPengecut.kecepatan : STAT_UNIT.ksatria.kecepatan;
    const radius = isPengecut ? STAT_UNIT.ksatriaPengecut.radius : STAT_UNIT.ksatria.radius;

    this.units.push({
      id: `ksatria-${fraksi}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fraksi,
      tipe: 'ksatria',
      subtipe: isPengecut ? 'pengecut' : 'standar',
      isKabur: false,
      chatKaburCooldown: 0,
      hp,
      maxHp: hp,
      atk,
      kecepatan,
      radius,
      x: spawnX,
      y: spawnY,
      cooldownSerang: 10,
      waktuLahir: Date.now(),
      namaPenyumbang: pengirim,
      sudutGerak: randomAngle
    });

    soundEffects.playSpawnKsatria(fraksi);
    this.buatPartikelLedakan(spawnX, spawnY, DATA_FRAKSI[fraksi].warnaCahaya, isPengecut ? 15 : 25);

    if (isPengecut) {
      this.tambahTeksMelayang(spawnX, spawnY - 30, `😱 KSATRIA PENGECUT! (KABUR-KABURAN)`, '#FDE047', 15);
    } else {
      this.tambahTeksMelayang(spawnX, spawnY - 30, `⚔️ KSATRIA ${DATA_FRAKSI[fraksi].nama.toUpperCase()}!`, DATA_FRAKSI[fraksi].warnaCahaya, 16);
    }

    this.updateStatistik();
  }

  /**
   * Memunculkan Monster Merah (dari Like atau Tombol GM)
   * Spawn di arah dan jarak yang acak
   */
  public spawnMonster(
    tipe: TipeUnit = 'prajurit',
    pengirim: string = 'Penonton',
    variasi: VariasiMonster = 'standar',
    jumlah: number = 1
  ) {
    const markasMonster = this.bases.filter((b) => b.fraksi === 'monster');
    const pusat = markasMonster.length > 0
      ? markasMonster[Math.floor(Math.random() * markasMonster.length)]
      : { x: DATA_FRAKSI.monster.pusatX, y: DATA_FRAKSI.monster.pusatY };

    for (let i = 0; i < jumlah; i++) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = 20 + Math.random() * 55;
      const spawnX = Math.max(60, Math.min(CANVAS_VIRTUAL_WIDTH - 60, pusat.x + Math.cos(randomAngle) * randomDistance));
      const spawnY = Math.max(280, Math.min(1060, pusat.y + Math.sin(randomAngle) * randomDistance));
      const isKsatria = tipe === 'ksatria';

      let hp = isKsatria ? STAT_UNIT.ksatria.hp : STAT_UNIT.prajurit.hp;
      let atk = isKsatria ? STAT_UNIT.ksatria.atk : STAT_UNIT.prajurit.atk;
      let radius = isKsatria ? STAT_UNIT.ksatria.radius : STAT_UNIT.prajurit.radius;

      // Variasi Primordial memiliki HP dan ATK ekstra
      if (variasi === 'primordial') {
        hp = 150;
        atk = 8;
        radius = 22;
      }

      this.units.push({
        id: `monster-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fraksi: 'monster',
        tipe,
        subtipe: 'standar',
        variasiMonster: variasi,
        hp,
        maxHp: hp,
        atk,
        kecepatan: isKsatria ? STAT_UNIT.ksatria.kecepatan : STAT_UNIT.prajurit.kecepatan,
        radius,
        x: spawnX,
        y: spawnY,
        cooldownSerang: 15,
        waktuLahir: Date.now(),
        namaPenyumbang: pengirim,
        sudutGerak: randomAngle
      });

      this.buatPartikelLedakan(spawnX, spawnY, '#EF4444', isKsatria ? 20 : 6);
    }

    if (tipe === 'ksatria') {
      soundEffects.playSpawnKsatria('monster');
      this.tambahTeksMelayang(pusat.x, pusat.y - 25, `MONSTER KUAT MUNCUL!`, '#EF4444', 16);
    } else {
      soundEffects.playSpawnPrajurit('monster');
    }

    this.updateStatistik();
  }

  /**
   * Update Logika Game tiap frame (~60 FPS)
   */
  public update(deltaMs: number) {
    if (this.fase === 'selesai') return;

    this.frameCounter++;

    // 1. Logika Timer Fase
    this.updateTimer(deltaMs);

    // 2. Markas Otomatis Spawn (5 detik prajurit, 30 detik ksatria)
    this.updateMarkasAutoSpawn();

    // 3. Logika Unit (Pergerakan & Pertarungan)
    // Pada Fase Persiapan: Unit hanya diam bersiap
    // Pada Fase Bertarung: Unit bergerak dan saling menyerang
    if (this.fase === 'pertarungan') {
      this.updatePertarunganDanPergerakan();
    }

    // 4. Update Penguasaan Wilayah Dinamis
    if (this.frameCounter % 15 === 0) {
      this.updatePenguasaanWilayah();
    }

    // 5. Update Partikel & Teks Melayang
    this.updateVisualEffects();

    // 6. Cek Kondisi Menang Mutlak (100% Wilayah)
    this.cekKondisiMenangMutlak();
  }

  /**
   * Manajemen Waktu dan Fase Pertandingan
   */
  private updateTimer(deltaMs: number) {
    const detik = deltaMs / 1000;
    this.waktuSisa -= detik;
    this.totalDetikBerjalan += detik;

    if (this.waktuSisa <= 0) {
      if (this.fase === 'persiapan') {
        // Pindah dari Fase Persiapan (12s) ke Fase Pertarungan (300s)
        this.fase = 'pertarungan';
        this.waktuSisa = DURASI_FASE_PERTARUNGAN;
        soundEffects.playFaseMulai();
        this.tambahTeksMelayang(CANVAS_VIRTUAL_WIDTH / 2, 580, 'PERTARUNGAN DIMULAI!', '#F59E0B', 28);
        if (this.onPhaseChangeCallback) this.onPhaseChangeCallback(this.fase);
      } else if (this.fase === 'pertarungan') {
        // Waktu 5 Menit Habis -> Pemenang adalah wilayah tertinggi
        this.waktuSisa = 0;
        this.selesaikanGame('waktu_habis');
      }
    }
  }

  /**
   * Auto-Spawn Markas
   * 1 Prajurit tiap 5 detik (300 frames)
   * 1 Ksatria tiap 30 detik (1800 frames)
   */
  private updateMarkasAutoSpawn() {
    this.bases.forEach((base) => {
      base.denyutAura = (base.denyutAura + 0.04) % (Math.PI * 2);

      // Kurangi timer
      base.timerPrajurit--;
      base.timerKsatria--;

      if (base.timerPrajurit <= 0) {
        base.timerPrajurit = 300; // Reset 5 detik
        base.totalSpawnPrajurit++;

        // Spawn 1 prajurit dari markas ini
        if (base.fraksi === 'monster') {
          this.spawnMonster('prajurit', 'Markas', 'standar', 1);
        } else {
          this.spawnPrajurit(base.fraksi, 'Markas', 1);
        }
      }

      if (base.timerKsatria <= 0) {
        base.timerKsatria = 1800; // Reset 30 detik
        base.totalSpawnKsatria++;

        // Spawn 1 ksatria dari markas ini
        if (base.fraksi === 'monster') {
          this.spawnMonster('ksatria', 'Markas Kuat', 'standar', 1);
        } else {
          this.spawnKsatria(base.fraksi, 'Markas Benteng');
        }
      }
    });
  }

  /**
   * Pergerakan AI & Sistem Tempur Otomatis
   * - Prajurit: Fokus merebut wilayah musuh, markas musuh, dan terakhir melawan ksatria
   * - Ksatria Biasa: Fokus memburu prajurit musuh, ksatria musuh, dan markas
   * - Ksatria Pengecut: Kabur dari musuh (lari kocar-kacir!) dan spesialis merebut wilayah musuh dengan super cepat
   */
  private updatePertarunganDanPergerakan() {
    const aliveUnits = this.units.filter((u) => u.hp > 0);
    const unitCount = aliveUnits.length;

    for (let i = 0; i < unitCount; i++) {
      const unit = aliveUnits[i];

      // Kurangi cooldown serang
      if (unit.cooldownSerang > 0) {
        unit.cooldownSerang--;
      }

      // Kurangi cooldown chat kabur untuk ksatria pengecut
      if (unit.chatKaburCooldown && unit.chatKaburCooldown > 0) {
        unit.chatKaburCooldown--;
      }

      // 1. Cari musuh terdekat (unit musuh)
      let musuhTerdekat: UnitGame | null = null;
      let jarakMinUnit = Infinity;

      for (let j = 0; j < unitCount; j++) {
        const calon = aliveUnits[j];
        if (calon.fraksi === unit.fraksi || calon.hp <= 0) continue;

        const d = Math.hypot(calon.x - unit.x, calon.y - unit.y);
        if (d < jarakMinUnit) {
          jarakMinUnit = d;
          musuhTerdekat = calon;
        }
      }

      // 2. Cari markas musuh terdekat yang masih berdiri
      let markasTerdekat: MarkasGame | null = null;
      let jarakMinBase = Infinity;

      for (let b = 0; b < this.bases.length; b++) {
        const baseMusuh = this.bases[b];
        if (baseMusuh.fraksi === unit.fraksi || baseMusuh.hp <= 0) continue;

        const d = Math.hypot(baseMusuh.x - unit.x, baseMusuh.y - unit.y);
        if (d < jarakMinBase) {
          jarakMinBase = d;
          markasTerdekat = baseMusuh;
        }
      }

      // 3. Cari titik wilayah musuh terdekat yang belum dikuasai fraksi ini
      let titikWilayahMusuhTerdekat: TitikWilayah | null = null;
      let jarakMinWilayah = Infinity;

      for (let p = 0; p < this.territoryPoints.length; p++) {
        const pt = this.territoryPoints[p];
        if (pt.pemilik !== unit.fraksi) {
          const d = Math.hypot(pt.x - unit.x, pt.y - unit.y);
          if (d < jarakMinWilayah) {
            jarakMinWilayah = d;
            titikWilayahMusuhTerdekat = pt;
          }
        }
      }

      // ==========================================
      // PERILAKU KHUSUS 1: KSATRIA PENGECUT
      // ==========================================
      if (unit.tipe === 'ksatria' && unit.subtipe === 'pengecut') {
        // Jika ada musuh mendekat dalam radius < 125px -> KABUR TERBIRIT-BIRIT!
        if (musuhTerdekat && jarakMinUnit < 125) {
          unit.isKabur = true;
          const fleeAngle = Math.atan2(unit.y - musuhTerdekat.y, unit.x - musuhTerdekat.x);
          unit.x += Math.cos(fleeAngle) * unit.kecepatan;
          unit.y += Math.sin(fleeAngle) * unit.kecepatan;
          unit.sudutGerak = fleeAngle;

          // Partikel debu lari
          if (Math.random() < 0.2) {
            this.buatPartikelLedakan(unit.x, unit.y, '#E2E8F0', 1);
          }

          // Teriak ketakutan lucu
          if (!unit.chatKaburCooldown || unit.chatKaburCooldown <= 0) {
            const teriakan = [
              'Lariiii! 😱',
              'Ampuuun! 🏃💨',
              'Jangan kejar aku! 💦',
              'Kaburrr! 🏃',
              'Aku cuma mau tanah! 🏳️',
              'Jangan dipukul! 😭'
            ];
            this.tambahTeksMelayang(
              unit.x,
              unit.y - 20,
              teriakan[Math.floor(Math.random() * teriakan.length)],
              '#FDE047',
              12
            );
            unit.chatKaburCooldown = 80; // cooldown ~1.3 detik
          }
        } else {
          // Aman -> Fokus merebut wilayah musuh dengan super kencang!
          unit.isKabur = false;
          if (titikWilayahMusuhTerdekat) {
            const angle = Math.atan2(titikWilayahMusuhTerdekat.y - unit.y, titikWilayahMusuhTerdekat.x - unit.x);
            unit.x += Math.cos(angle) * unit.kecepatan;
            unit.y += Math.sin(angle) * unit.kecepatan;
            unit.sudutGerak = angle;

            // Jika sampai di titik wilayah musuh, rebut instan!
            if (jarakMinWilayah < 40) {
              titikWilayahMusuhTerdekat.pengaruh[unit.fraksi] = Math.min(
                100,
                (titikWilayahMusuhTerdekat.pengaruh[unit.fraksi] || 0) + 30
              );
              if (titikWilayahMusuhTerdekat.pengaruh[unit.fraksi] >= 50) {
                titikWilayahMusuhTerdekat.pemilik = unit.fraksi;
              }
            }
          }
        }
      }

      // ==========================================
      // PERILAKU KHUSUS 2: PRAJURIT BIASA
      // Fokus: Merebut wilayah musuh, markas musuh, dan terakhir melawan musuh
      // ==========================================
      else if (unit.tipe === 'prajurit') {
        const jangkauanSerangUnit = unit.radius + (musuhTerdekat?.radius || 0) + 6;
        const jangkauanSerangBase = unit.radius + (markasTerdekat?.radius || 0) + 8;

        // 1. Jika musuh menempel di depan muka (terpaksa membela diri)
        if (musuhTerdekat && jarakMinUnit <= jangkauanSerangUnit) {
          if (unit.cooldownSerang <= 0) {
            musuhTerdekat.hp -= unit.atk;
            unit.cooldownSerang = 42;
            soundEffects.playHit();

            const midX = (unit.x + musuhTerdekat.x) / 2;
            const midY = (unit.y + musuhTerdekat.y) / 2;
            this.buatPartikelLedakan(midX, midY, DATA_FRAKSI[unit.fraksi].warnaCahaya, 3);
            this.tambahTeksMelayang(musuhTerdekat.x, musuhTerdekat.y - 12, `-${unit.atk}`, '#FFFFFF', 11);

            if (musuhTerdekat.hp <= 0) {
              this.skor.totalKill[unit.fraksi]++;
              this.buatPartikelLedakan(musuhTerdekat.x, musuhTerdekat.y, DATA_FRAKSI[musuhTerdekat.fraksi].warnaUtama, 14);
            }
          }
        }
        // 2. Jika markas musuh dekat (< 150px), serbu markas musuh!
        else if (markasTerdekat && jarakMinBase <= 150) {
          if (jarakMinBase <= jangkauanSerangBase) {
            if (unit.cooldownSerang <= 0) {
              markasTerdekat.hp = Math.max(0, markasTerdekat.hp - unit.atk);
              unit.cooldownSerang = 40;
              soundEffects.playHit();

              this.buatPartikelLedakan((unit.x + markasTerdekat.x) / 2, (unit.y + markasTerdekat.y) / 2, DATA_FRAKSI[unit.fraksi].warnaCahaya, 4);
              this.tambahTeksMelayang(markasTerdekat.x + (Math.random() - 0.5) * 30, markasTerdekat.y - 20, `-${unit.atk}`, '#FFFFFF', 11);

              if (markasTerdekat.hp <= 0) {
                soundEffects.playMarkasHancur();
                this.buatPartikelLedakan(markasTerdekat.x, markasTerdekat.y, DATA_FRAKSI[markasTerdekat.fraksi].warnaCahaya, 50);
                this.tambahTeksMelayang(markasTerdekat.x, markasTerdekat.y - 35, `MARKAS ${DATA_FRAKSI[markasTerdekat.fraksi].nama.toUpperCase()} HANCUR!`, '#EF4444', 18);
              }
            }
          } else {
            const angle = Math.atan2(markasTerdekat.y - unit.y, markasTerdekat.x - unit.x);
            unit.x += Math.cos(angle) * unit.kecepatan;
            unit.y += Math.sin(angle) * unit.kecepatan;
            unit.sudutGerak = angle;
          }
        }
        // 3. Fokus Utama Prajurit: MEREBUT WILAYAH MUSUH!
        else if (titikWilayahMusuhTerdekat) {
          const angle = Math.atan2(titikWilayahMusuhTerdekat.y - unit.y, titikWilayahMusuhTerdekat.x - unit.x);
          unit.x += Math.cos(angle) * unit.kecepatan;
          unit.y += Math.sin(angle) * unit.kecepatan;
          unit.sudutGerak = angle;
        } else if (musuhTerdekat) {
          // Terakhir: Kejar musuh jika wilayah sudah bersih
          const angle = Math.atan2(musuhTerdekat.y - unit.y, musuhTerdekat.x - unit.x);
          unit.x += Math.cos(angle) * unit.kecepatan;
          unit.y += Math.sin(angle) * unit.kecepatan;
          unit.sudutGerak = angle;
        }
      }

      // ==========================================
      // PERILAKU KHUSUS 3: KSATRIA BIASA (PETARUNG TANGGUH)
      // Fokus: Menyerang prajurit, ksatria musuh, dan markas lawan
      // ==========================================
      else {
        const jangkauanSerangUnit = unit.radius + (musuhTerdekat?.radius || 0) + 6;
        const jangkauanSerangBase = unit.radius + (markasTerdekat?.radius || 0) + 8;

        if (musuhTerdekat && (jarakMinUnit <= 160 || !markasTerdekat)) {
          // Menyerang atau mengejar unit musuh (prajurit/ksatria)
          if (jarakMinUnit <= jangkauanSerangUnit) {
            if (unit.cooldownSerang <= 0) {
              musuhTerdekat.hp -= unit.atk;
              unit.cooldownSerang = 26;
              soundEffects.playHit();

              const midX = (unit.x + musuhTerdekat.x) / 2;
              const midY = (unit.y + musuhTerdekat.y) / 2;
              this.buatPartikelLedakan(midX, midY, DATA_FRAKSI[unit.fraksi].warnaCahaya, 5);
              this.tambahTeksMelayang(musuhTerdekat.x, musuhTerdekat.y - 12, `-${unit.atk}`, '#FBBF24', 14);

              if (musuhTerdekat.hp <= 0) {
                this.skor.totalKill[unit.fraksi]++;
                this.buatPartikelLedakan(musuhTerdekat.x, musuhTerdekat.y, DATA_FRAKSI[musuhTerdekat.fraksi].warnaUtama, 18);
              }
            }
          } else {
            const angle = Math.atan2(musuhTerdekat.y - unit.y, musuhTerdekat.x - unit.x);
            unit.x += Math.cos(angle) * unit.kecepatan;
            unit.y += Math.sin(angle) * unit.kecepatan;
            unit.sudutGerak = angle;
          }
        } else if (markasTerdekat) {
          // Menyerbu markas musuh
          if (jarakMinBase <= jangkauanSerangBase) {
            if (unit.cooldownSerang <= 0) {
              markasTerdekat.hp = Math.max(0, markasTerdekat.hp - unit.atk);
              unit.cooldownSerang = 24;
              soundEffects.playHit();

              const midX = (unit.x + markasTerdekat.x) / 2;
              const midY = (unit.y + markasTerdekat.y) / 2;
              this.buatPartikelLedakan(midX, midY, DATA_FRAKSI[unit.fraksi].warnaCahaya, 6);
              this.tambahTeksMelayang(markasTerdekat.x + (Math.random() - 0.5) * 35, markasTerdekat.y - 25, `-${unit.atk}`, '#FBBF24', 15);

              if (markasTerdekat.hp <= 0) {
                soundEffects.playMarkasHancur();
                this.buatPartikelLedakan(markasTerdekat.x, markasTerdekat.y, DATA_FRAKSI[markasTerdekat.fraksi].warnaCahaya, 50);
                this.tambahTeksMelayang(markasTerdekat.x, markasTerdekat.y - 35, `MARKAS ${DATA_FRAKSI[markasTerdekat.fraksi].nama.toUpperCase()} HANCUR!`, '#EF4444', 18);
              }
            }
          } else {
            const angle = Math.atan2(markasTerdekat.y - unit.y, markasTerdekat.x - unit.x);
            unit.x += Math.cos(angle) * unit.kecepatan;
            unit.y += Math.sin(angle) * unit.kecepatan;
            unit.sudutGerak = angle;
          }
        } else if (titikWilayahMusuhTerdekat) {
          const angle = Math.atan2(titikWilayahMusuhTerdekat.y - unit.y, titikWilayahMusuhTerdekat.x - unit.x);
          unit.x += Math.cos(angle) * unit.kecepatan;
          unit.y += Math.sin(angle) * unit.kecepatan;
          unit.sudutGerak = angle;
        }
      }

      // Batasi agar unit tetap di dalam kanvas
      unit.x = Math.max(50, Math.min(CANVAS_VIRTUAL_WIDTH - 50, unit.x));
      unit.y = Math.max(260, Math.min(1080, unit.y));
    }

    // Bersihkan markas yang telah hancur (HP <= 0)
    const basesSebelumnya = this.bases.length;
    this.bases = this.bases.filter((b) => b.hp > 0);
    if (this.bases.length !== basesSebelumnya) {
      this.updateStatistik();
    }

    // Bersihkan unit yang telah tewas
    this.units = this.units.filter((u) => u.hp > 0);
  }

  /**
   * Logika Penguasaan Wilayah Dinamis
   * Menghitung pengaruh unit pada titik sampling diagram Venn
   */
  private updatePenguasaanWilayah() {
    const totalPoints = this.territoryPoints.length;
    if (totalPoints === 0) return;

    const hitunganWilayah: Record<FraksiKerajaan, number> = {
      hijau: 0,
      kuning: 0,
      biru: 0,
      monster: 0
    };

    // Evaluasi tiap titik wilayah
    this.territoryPoints.forEach((pt) => {
      // Hitung kekuatan unit di sekitar titik ini (radius pengaruh 65px)
      const pengaruhUnit: Record<FraksiKerajaan, number> = {
        hijau: 0,
        kuning: 0,
        biru: 0,
        monster: 0
      };

      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        const dist = Math.hypot(u.x - pt.x, u.y - pt.y);
        if (dist <= 65) {
          // Ksatria pengecut memiliki pengaruh perebutan wilayah paling besar!
          const power = u.subtipe === 'pengecut' ? 7 : u.tipe === 'ksatria' ? 4 : 2;
          pengaruhUnit[u.fraksi] += power;
        }
      }

      // Tambahkan pengaruh markas
      this.bases.forEach((b) => {
        const distBase = Math.hypot(b.x - pt.x, b.y - pt.y);
        if (distBase <= 80) {
          pengaruhUnit[b.fraksi] += 3;
        }
      });

      // Tentukan fraksi dengan pengaruh tertinggi di titik ini
      let dominant: FraksiKerajaan | null = null;
      let maxPower = 0;

      const fraksiList: FraksiKerajaan[] = ['hijau', 'kuning', 'biru', 'monster'];
      for (const f of fraksiList) {
        if (pengaruhUnit[f] > maxPower) {
          maxPower = pengaruhUnit[f];
          dominant = f;
        }
      }

      if (dominant !== null && maxPower > 0) {
        const dom: FraksiKerajaan = dominant;
        pt.pengaruh[dom] = Math.min(100, (pt.pengaruh[dom] || 0) + 15);
        for (const f of fraksiList) {
          if (f !== dom) {
            pt.pengaruh[f] = Math.max(0, (pt.pengaruh[f] || 0) - 8);
          }
        }

        if (pt.pengaruh[dom] >= 55) {
          pt.pemilik = dom;
        }
      }

      hitunganWilayah[pt.pemilik]++;
    });

    // Hitung persentase wilayah
    const pctHijau = Math.round((hitunganWilayah.hijau / totalPoints) * 100);
    const pctKuning = Math.round((hitunganWilayah.kuning / totalPoints) * 100);
    const pctBiru = Math.round((hitunganWilayah.biru / totalPoints) * 100);
    const pctMonster = Math.max(0, 100 - (pctHijau + pctKuning + pctBiru));

    this.skor.persentaseWilayah = {
      hijau: pctHijau,
      kuning: pctKuning,
      biru: pctBiru,
      monster: pctMonster
    };

    this.updateStatistik();
  }

  /**
   * Cek Apakah Ada Kerajaan yang Menguasai 100% Wilayah atau Menghancurkan Semua Markas Lawan
   */
  private cekKondisiMenangMutlak() {
    const fractions: FraksiKerajaan[] = ['hijau', 'kuning', 'biru', 'monster'];

    // 1. Cek penguasaan wilayah 100%
    for (const f of fractions) {
      if (this.skor.persentaseWilayah[f] >= 100) {
        this.selesaikanGame('mutlak', f);
        return;
      }
    }

    // 2. Cek apakah seluruh markas dan unit fraksi lain telah musnah (Total Annihilation)
    if (this.fase === 'pertarungan') {
      const survivingFactions = fractions.filter((f) => {
        const hasBase = this.bases.some((b) => b.fraksi === f && b.hp > 0);
        const hasUnit = this.units.some((u) => u.fraksi === f && u.hp > 0);
        return hasBase || hasUnit;
      });

      if (survivingFactions.length === 1) {
        this.selesaikanGame('mutlak', survivingFactions[0]);
      }
    }
  }

  /**
   * Selesaikan Pertandingan
   */
  public selesaikanGame(alasan: 'mutlak' | 'waktu_habis', pemenangMutlak?: FraksiKerajaan) {
    if (this.fase === 'selesai') return;

    this.fase = 'selesai';
    this.alasanMenang = alasan;

    if (pemenangMutlak) {
      this.pemenang = pemenangMutlak;
    } else {
      // Ambil pemenang berdasarkan persentase tertinggi saat waktu habis
      let pemenangTerpilih: FraksiKerajaan = 'hijau';
      let maxPct = -1;

      (['hijau', 'kuning', 'biru', 'monster'] as FraksiKerajaan[]).forEach((f) => {
        if (this.skor.persentaseWilayah[f] > maxPct) {
          maxPct = this.skor.persentaseWilayah[f];
          pemenangTerpilih = f;
        }
      });
      this.pemenang = pemenangTerpilih;
    }

    soundEffects.playKemenangan();

    if (this.onGameEndCallback && this.pemenang) {
      this.onGameEndCallback(this.pemenang, alasan);
    }
  }

  /**
   * Sinkronisasi Statistik
   */
  private updateStatistik() {
    const pCounts: Record<FraksiKerajaan, number> = { hijau: 0, kuning: 0, biru: 0, monster: 0 };
    const kCounts: Record<FraksiKerajaan, number> = { hijau: 0, kuning: 0, biru: 0, monster: 0 };
    const bCounts: Record<FraksiKerajaan, number> = { hijau: 0, kuning: 0, biru: 0, monster: 0 };

    this.units.forEach((u) => {
      if (u.tipe === 'ksatria') kCounts[u.fraksi]++;
      else pCounts[u.fraksi]++;
    });

    this.bases.forEach((b) => {
      bCounts[b.fraksi]++;
    });

    this.skor.jumlahPrajurit = pCounts;
    this.skor.jumlahKsatria = kCounts;
    this.skor.jumlahMarkas = bCounts;

    if (this.onScoreUpdateCallback) {
      this.onScoreUpdateCallback({ ...this.skor });
    }
  }

  /**
   * Efek Partikel & Teks Melayang
   */
  public buatPartikelLedakan(x: number, y: number, warna: string, jumlah: number = 10) {
    for (let i = 0; i < jumlah; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        warna,
        ukuran: 2 + Math.random() * 4,
        umur: 0,
        maxUmur: 20 + Math.random() * 25
      });
    }
  }

  public tambahTeksMelayang(x: number, y: number, teks: string, warna: string, ukuran: number = 14) {
    this.floatingTexts.push({
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      x,
      y,
      teks,
      warna,
      ukuran,
      umur: 0,
      maxUmur: 50
    });
  }

  private updateVisualEffects() {
    // Update partikel
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.umur++;
    });
    this.particles = this.particles.filter((p) => p.umur < p.maxUmur);

    // Update teks melayang
    this.floatingTexts.forEach((t) => {
      t.y -= 0.8;
      t.umur++;
    });
    this.floatingTexts = this.floatingTexts.filter((t) => t.umur < t.maxUmur);
  }

  /**
   * RENDER UTAMA HTML5 CANVAS (60 FPS)
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const scaleX = width / CANVAS_VIRTUAL_WIDTH;
    const scaleY = height / CANVAS_VIRTUAL_HEIGHT;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. Bersihkan Latar Belakang (Nuansa Gelap Premium Arena TikTok)
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

    // 2. Gambar Grid Latar Belakang Halus
    this.renderLatarGrid(ctx);

    // 3. Render Peta Wilayah Diagram Venn dengan Warna Dinamis
    this.renderPetaVenn(ctx);

    // 4. Render Markas-Markas Kerajaan
    this.renderMarkas(ctx);

    // 5. Render Seluruh Unit Prajurit & Ksatria
    this.renderUnits(ctx);

    // 6. Render Efek Partikel
    this.renderPartikel(ctx);

    // 7. Render Teks Melayang (Damage & Notifikasi)
    this.renderTeksMelayang(ctx);

    // 8. Render Overlay Akhir Permainan jika Selesai
    if (this.fase === 'selesai' && this.pemenang) {
      this.renderOverlayKemenangan(ctx);
    }

    ctx.restore();
  }

  private renderLatarGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < CANVAS_VIRTUAL_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_VIRTUAL_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_VIRTUAL_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_VIRTUAL_WIDTH, y);
      ctx.stroke();
    }
  }

  /**
   * Menggambar 3 Lingkaran Besar Diagram Venn dan Zona Tengah Monster
   */
  private renderPetaVenn(ctx: CanvasRenderingContext2D) {
    // Gambar titik-titik wilayah dinamis
    this.territoryPoints.forEach((pt) => {
      const info = DATA_FRAKSI[pt.pemilik];
      const alpha = 0.22 + (pt.pengaruh[pt.pemilik] / 100) * 0.28;

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radiusSektor, 0, Math.PI * 2);
      ctx.fillStyle = info.warnaUtama;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    });

    // Gambar Garis Batas 3 Lingkaran Besar Diagram Venn
    const lingkaran = [
      { info: DATA_FRAKSI.hijau },
      { info: DATA_FRAKSI.kuning },
      { info: DATA_FRAKSI.biru }
    ];

    lingkaran.forEach(({ info }) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(info.pusatX, info.pusatY, info.radiusWilayah, 0, Math.PI * 2);
      ctx.strokeStyle = info.warnaCahaya;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.65;
      ctx.shadowColor = info.warnaUtama;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    });

    // Zona Monster (Irisan Tengah)
    ctx.save();
    ctx.beginPath();
    ctx.arc(DATA_FRAKSI.monster.pusatX, DATA_FRAKSI.monster.pusatY, DATA_FRAKSI.monster.radiusWilayah, 0, Math.PI * 2);
    ctx.strokeStyle = DATA_FRAKSI.monster.warnaCahaya;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    // Label Wilayah
    this.renderLabelWilayah(ctx);
  }

  private renderLabelWilayah(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';

    // Hijau
    ctx.fillStyle = DATA_FRAKSI.hijau.warnaCahaya;
    ctx.fillText('KERAJAAN HIJAU', DATA_FRAKSI.hijau.pusatX, DATA_FRAKSI.hijau.pusatY - 140);

    // Kuning
    ctx.fillStyle = DATA_FRAKSI.kuning.warnaCahaya;
    ctx.fillText('KERAJAAN KUNING', DATA_FRAKSI.kuning.pusatX, DATA_FRAKSI.kuning.pusatY - 140);

    // Biru
    ctx.fillStyle = DATA_FRAKSI.biru.warnaCahaya;
    ctx.fillText('KERAJAAN BIRU', DATA_FRAKSI.biru.pusatX, DATA_FRAKSI.biru.pusatY + 160);

    // Monster
    ctx.fillStyle = DATA_FRAKSI.monster.warnaCahaya;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ZONA MONSTER', DATA_FRAKSI.monster.pusatX, DATA_FRAKSI.monster.pusatY - 45);
    ctx.restore();
  }

  /**
   * Menggambar Markas Kerajaan
   */
  private renderMarkas(ctx: CanvasRenderingContext2D) {
    this.bases.forEach((b) => {
      const info = DATA_FRAKSI[b.fraksi];

      ctx.save();
      // Aura berdenyut
      const pulseSize = b.radius + Math.sin(b.denyutAura) * 6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = info.warnaAura;
      ctx.fill();

      // Cincin Luar Markas (Progress Timer Spawn Prajurit)
      const pctPrajurit = 1 - (b.timerPrajurit / 300);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 3, -Math.PI / 2, -Math.PI / 2 + (pctPrajurit * Math.PI * 2));
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Bentuk Markas
      ctx.beginPath();
      if (b.fraksi === 'monster') {
        // Markas Monster Berbentuk Kristal Belah Ketupat Merah
        ctx.moveTo(b.x, b.y - b.radius);
        ctx.lineTo(b.x + b.radius, b.y);
        ctx.lineTo(b.x, b.y + b.radius);
        ctx.lineTo(b.x - b.radius, b.y);
        ctx.closePath();
      } else {
        // Markas Kerajaan Berbentuk Benteng Melingkar
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      }

      ctx.fillStyle = info.warnaSekunder;
      ctx.fill();
      ctx.strokeStyle = info.warnaCahaya;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Ikon Markas
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = b.fraksi === 'monster' ? '👹' : b.fraksi === 'hijau' ? '🏰' : b.fraksi === 'kuning' ? '⭐' : '🛡️';
      ctx.fillText(icon, b.x, b.y);

      // Label & Bar HP Markas (10.000 HP)
      const barW = 76;
      const barH = 7;
      const hpPct = Math.max(0, b.hp / b.maxHp);
      const barY = b.y + b.radius + 10;

      // Bar Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(b.x - barW / 2, barY, barW, barH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - barW / 2, barY, barW, barH);

      // Bar Fill
      ctx.fillStyle = hpPct > 0.5 ? '#10B981' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(b.x - barW / 2, barY, barW * hpPct, barH);

      // Angka HP Markas
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`HP: ${b.hp.toLocaleString('id-ID')} / 10.000`, b.x, barY - 2);

      // Label Markas
      ctx.font = 'bold 9px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillStyle = info.warnaCahaya;
      ctx.fillText('MARKAS', b.x, barY + barH + 2);

      // Efek Asap / Bara Rusak jika HP < 5000
      if (b.hp < b.maxHp * 0.5 && Math.random() < 0.15) {
        this.buatPartikelLedakan(b.x + (Math.random() - 0.5) * 20, b.y - b.radius, '#EF4444', 1);
      }

      ctx.restore();
    });
  }

  /**
   * Menggambar Seluruh Unit (Prajurit & Ksatria)
   */
  private renderUnits(ctx: CanvasRenderingContext2D) {
    this.units.forEach((u) => {
      const info = DATA_FRAKSI[u.fraksi];
      const isKsatria = u.tipe === 'ksatria';
      const isPengecut = isKsatria && u.subtipe === 'pengecut';

      ctx.save();
      ctx.translate(u.x, u.y);

      // Jika Ksatria Pengecut: Tampilkan lebih pudar (transparan/pastel)
      if (isPengecut) {
        ctx.globalAlpha = 0.65;
      }

      // Aura Ksatria yang Bersinar
      if (isKsatria) {
        ctx.beginPath();
        ctx.arc(0, 0, u.radius + (isPengecut ? 4 : 6), 0, Math.PI * 2);
        ctx.fillStyle = isPengecut ? 'rgba(253, 224, 71, 0.25)' : info.warnaAura;
        ctx.fill();
        ctx.strokeStyle = isPengecut ? '#FDE047' : info.warnaCahaya;
        ctx.lineWidth = isPengecut ? 1.5 : 2;
        if (isPengecut) {
          ctx.setLineDash([3, 3]); // Garis putus-putus bergetar cemas
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Gambar Bentuk Tubuh Unit
      ctx.beginPath();
      if (u.fraksi === 'monster') {
        // Ragam Monster Merah Berdasarkan Variasi
        this.renderBentukMonster(ctx, u);
      } else {
        // Prajurit / Ksatria Kerajaan (Lingkaran Tegas dengan Lapisan Warna)
        ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
        ctx.fillStyle = isPengecut ? '#FEF08A' : isKsatria ? info.warnaCahaya : info.warnaUtama;
        ctx.fill();
        ctx.strokeStyle = isPengecut ? '#EAB308' : '#FFFFFF';
        ctx.lineWidth = isKsatria ? 2.5 : 1.5;
        ctx.stroke();
      }

      // Arah Hadap (Mata / Titik Indikator)
      const lookX = Math.cos(u.sudutGerak) * (u.radius * 0.6);
      const lookY = Math.sin(u.sudutGerak) * (u.radius * 0.6);
      ctx.beginPath();
      ctx.arc(lookX, lookY, isKsatria ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isPengecut ? '#000000' : '#FFFFFF';
      ctx.fill();

      // Emotikon Lucu & Tanda Ksatria Pengecut
      if (isPengecut) {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Tampilkan 😱 saat kabur atau 🏃💨 saat sprint
        const emote = u.isKabur ? '😱💦' : '🏃💨';
        ctx.fillText(emote, 0, -u.radius - 8);

        ctx.font = 'bold 7px sans-serif';
        ctx.fillStyle = '#EAB308';
        ctx.fillText('PENAKUT', 0, u.radius + 10);
      }

      // Mini Health Bar di atas kepala jika HP berkurang
      if (u.hp < u.maxHp && !isPengecut) {
        const barW = u.radius * 2;
        const barH = 3;
        const hpPct = Math.max(0, u.hp / u.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, -u.radius - 8, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#10B981' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
        ctx.fillRect(-barW / 2, -u.radius - 8, barW * hpPct, barH);
      }

      // Nama Penyetor (Jika Ada)
      if (isKsatria && u.namaPenyumbang && !isPengecut) {
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(u.namaPenyumbang.substring(0, 8), 0, -u.radius - 12);
      }

      ctx.restore();
    });
  }

  /**
   * Rendering Visual Variasi Monster Merah ('T','Y','U','I','O','P')
   */
  private renderBentukMonster(ctx: CanvasRenderingContext2D, u: UnitGame) {
    const isKsatria = u.tipe === 'ksatria';
    const r = u.radius;

    switch (u.variasiMonster) {
      case 'gorgon': // Persegi berduri bertanduk
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fillStyle = '#B91C1C';
        ctx.fill();
        ctx.strokeStyle = '#FCA5A5';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'naga': // Lingkaran dengan bara sayap
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#991B1B';
        ctx.fill();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'raksasa': // Persegi zirah baja merah
        ctx.rect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
        ctx.fillStyle = '#7F1D1D';
        ctx.fill();
        ctx.strokeStyle = '#F87171';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'bayangan': // Bintang heksagonal
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#450A0A';
        ctx.fill();
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'primordial': // Raja monster super besar
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#7F1D1D';
        ctx.fill();
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        break;

      default:
        // Standar
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = isKsatria ? '#DC2626' : '#EF4444';
        ctx.fill();
        ctx.strokeStyle = '#FEE2E2';
        ctx.lineWidth = isKsatria ? 2.5 : 1.5;
        ctx.stroke();
        break;
    }
  }

  private renderPartikel(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.save();
      const alpha = 1 - (p.umur / p.maxUmur);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.ukuran, 0, Math.PI * 2);
      ctx.fillStyle = p.warna;
      ctx.fill();
      ctx.restore();
    });
  }

  private renderTeksMelayang(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((t) => {
      ctx.save();
      const alpha = 1 - (t.umur / t.maxUmur);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `bold ${t.ukuran}px sans-serif`;
      ctx.fillStyle = t.warna;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.teks, t.x, t.y);
      ctx.restore();
    });
  }

  /**
   * Overlay Kemenangan saat Pertandingan Berakhir
   */
  private renderOverlayKemenangan(ctx: CanvasRenderingContext2D) {
    if (!this.pemenang) return;
    const info = DATA_FRAKSI[this.pemenang];

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

    // Banner Kemenangan
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText('🏆 PERTANDINGAN BERAKHIR 🏆', CANVAS_VIRTUAL_WIDTH / 2, 540);

    ctx.font = '900 36px sans-serif';
    ctx.fillStyle = info.warnaCahaya;
    ctx.shadowColor = info.warnaUtama;
    ctx.shadowBlur = 20;
    ctx.fillText(`PEMENANG:`, CANVAS_VIRTUAL_WIDTH / 2, 600);
    ctx.fillText(`${info.nama.toUpperCase()}`, CANVAS_VIRTUAL_WIDTH / 2, 650);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#E5E7EB';
    ctx.shadowBlur = 0;
    const pesanAlasan = this.alasanMenang === 'mutlak'
      ? 'MENANG MUTLAK! Menguasai 100% Wilayah'
      : `WAKTU HABIS! Penguasaan Wilayah: ${this.skor.persentaseWilayah[this.pemenang]}%`;
    ctx.fillText(pesanAlasan, CANVAS_VIRTUAL_WIDTH / 2, 710);

    ctx.restore();
  }
}
