/**
 * TIGA KERAJAAN VS MONSTER - SERVER BACKEND
 * Full-Stack Node.js Server dengan Next.js, Socket.IO, dan tiktok-live-connector (zerodytrash)
 * Seluruh antarmuka, log, dan sistem menggunakan Bahasa Indonesia.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Menyimpan koneksi TikTok aktif
let tiktokLiveConnection = null;
let currentTikTokUsername = '';
// Melacak tim terakhir yang didukung oleh setiap penonton (berdasarkan chat 1/2/3)
const userTeamHistory = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      // Endpoint status API backend
      if (parsedUrl.pathname === '/api/tiktok/status') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          terhubung: !!tiktokLiveConnection,
          username: currentTikTokUsername,
          waktuServer: new Date().toISOString()
        }));
        return;
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Kesalahan pada HTTP Server:', err);
      res.statusCode = 500;
      res.end('Kesalahan Server Internal');
    }
  });

  // Inisialisasi Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  console.log('⚡ Menginisialisasi Socket.IO untuk Tiga Kerajaan vs Monster...');

  io.on('connection', (socket) => {
    console.log(`[Socket] Klien terhubung: ${socket.id}`);

    // Kirim status TikTok terkini ke klien yang baru bergabung
    socket.emit('tiktok_status', {
      status: tiktokLiveConnection ? 'connected' : 'disconnected',
      username: currentTikTokUsername,
      pesan: tiktokLiveConnection 
        ? `Tersambung ke siaran TikTok @${currentTikTokUsername}` 
        : 'Belum terhubung ke siaran TikTok.'
    });

    /**
     * MENGHUBUNGKAN KE TIKTOK LIVE
     */
    socket.on('hubungkan_tiktok', async ({ username }) => {
      const targetUser = (username || '').trim().replace(/^@/, '');
      if (!targetUser) {
        socket.emit('tiktok_error', { pesan: 'Username TikTok tidak boleh kosong!' });
        return;
      }

      console.log(`[TikTok] Mencoba menghubungkan ke @${targetUser}...`);
      io.emit('tiktok_status', {
        status: 'connecting',
        username: targetUser,
        pesan: `Sedang mencoba menghubungkan ke live @${targetUser}...`
      });

      // Putuskan koneksi sebelumnya jika ada
      if (tiktokLiveConnection) {
        try {
          tiktokLiveConnection.disconnect();
        } catch (e) {
          console.warn('[TikTok] Gagal menutup koneksi lama:', e.message);
        }
        tiktokLiveConnection = null;
      }

      try {
        // Inisialisasi WebcastPushConnection
        const tiktok = new WebcastPushConnection(targetUser, {
          processInitialData: false,
          enableExtendedGiftInfo: true,
          enableWebsocketUpgrade: true,
          requestPollingIntervalMs: 1000,
          clientParams: {
            app_language: 'id-ID',
            device_platform: 'web'
          }
        });

        // 1. EVENT TERHUBUNG
        tiktok.connect()
          .then((state) => {
            tiktokLiveConnection = tiktok;
            currentTikTokUsername = targetUser;
            console.log(`[TikTok] Berhasil terhubung ke Room ID: ${state.roomId}`);
            io.emit('tiktok_status', {
              status: 'connected',
              username: targetUser,
              roomId: state.roomId,
              pesan: `Berhasil tersambung ke TikTok Live @${targetUser}!`
            });
            io.emit('notifikasi_game', {
              tipe: 'sukses',
              teks: `Tersambung ke Live @${targetUser}!`
            });
          })
          .catch((err) => {
            console.error(`[TikTok] Gagal terhubung ke @${targetUser}:`, err.message);
            io.emit('tiktok_status', {
              status: 'error',
              username: targetUser,
              pesan: `Gagal terhubung ke @${targetUser}: ${err.message || 'Streamer mungkin sedang offline.'}`
            });
          });

        // 2. EVENT CHAT (KOMENTAR PENONTON)
        tiktok.on('chat', (data) => {
          const rawComment = (data.comment || '').trim();
          const senderUser = data.uniqueId || 'Penonton';
          const senderNick = data.nickname || senderUser;

          console.log(`[Chat TikTok] @${senderUser}: ${rawComment}`);

          let fraksi = null;
          if (rawComment === '1' || rawComment.startsWith('1 ')) {
            fraksi = 'hijau';
          } else if (rawComment === '2' || rawComment.startsWith('2 ')) {
            fraksi = 'kuning';
          } else if (rawComment === '3' || rawComment.startsWith('3 ')) {
            fraksi = 'biru';
          }

          if (fraksi) {
            // Catat dukungan tim terakhir penonton
            userTeamHistory.set(senderUser, fraksi);

            // Kirim event spawn prajurit ke frontend
            // Jumlah prajurit yang muncul dihitung di frontend berdasarkan jumlah Markas yang dimiliki kerajaan
            io.emit('aksi_game', {
              tipe: 'spawn_prajurit_chat',
              fraksi: fraksi,
              pengirim: senderNick,
              username: senderUser,
              komentar: rawComment,
              waktu: Date.now()
            });
          }
        });

        // 3. EVENT LIKE (TAP-TAP LAYAR)
        tiktok.on('like', (data) => {
          const senderUser = data.uniqueId || 'Penonton';
          const likeCount = Math.min(data.likeCount || 1, 5); // Batasi ledakan like per tick

          console.log(`[Like TikTok] @${senderUser} mengirim ${likeCount} likes`);

          // Memunculkan Monster Merah (Prajurit) di Zona Merah
          io.emit('aksi_game', {
            tipe: 'spawn_monster_like',
            jumlah: likeCount,
            pengirim: data.nickname || senderUser,
            username: senderUser,
            waktu: Date.now()
          });
        });

        // 4. EVENT FOLLOW (PENGIKUT BARU)
        tiktok.on('follow', (data) => {
          const senderUser = data.uniqueId || 'Pengikut Baru';
          const senderNick = data.nickname || senderUser;

          console.log(`[Follow TikTok] @${senderUser} mulai mengikuti!`);

          // Menambah 1 Markas untuk Kerajaan Monster (Merah)
          io.emit('aksi_game', {
            tipe: 'tambah_markas_follow',
            fraksi: 'monster',
            pengirim: senderNick,
            username: senderUser,
            waktu: Date.now()
          });
        });

        // 5. EVENT GIFT (HADIAH KOIN TIKTOK)
        tiktok.on('gift', (data) => {
          // Jangan proses gift jika masih dalam status repeat streak dan belum selesai, 
          // atau proses tiap increment
          const senderUser = data.uniqueId || 'Pemberi Gift';
          const senderNick = data.nickname || senderUser;
          const giftName = (data.giftName || '').toLowerCase();
          const diamondCount = (data.diamondCount || 1) * (data.repeatCount || 1);
          const repeatCount = data.repeatCount || 1;

          console.log(`[Gift TikTok] @${senderUser} mengirim ${data.giftName} (Nilai: ${diamondCount} koin, Jumlah: ${repeatCount})`);

          // 1. Gift Koin Murah (Koin ~1)
          // Mawar (Rose) = Ksatria Hijau
          // GG = Ksatria Kuning
          // Kopi / Donat / Es Krim = Ksatria Biru
          if (giftName.includes('rose') || giftName.includes('mawar')) {
            userTeamHistory.set(senderUser, 'hijau');
            io.emit('aksi_game', {
              tipe: 'spawn_ksatria_gift',
              fraksi: 'hijau',
              namaGift: data.giftName,
              koin: diamondCount,
              pengirim: senderNick,
              username: senderUser,
              waktu: Date.now()
            });
          } else if (giftName.includes('gg')) {
            userTeamHistory.set(senderUser, 'kuning');
            io.emit('aksi_game', {
              tipe: 'spawn_ksatria_gift',
              fraksi: 'kuning',
              namaGift: data.giftName,
              koin: diamondCount,
              pengirim: senderNick,
              username: senderUser,
              waktu: Date.now()
            });
          } else if (
            giftName.includes('coffee') || 
            giftName.includes('kopi') || 
            giftName.includes('donut') || 
            giftName.includes('ice cream') || 
            giftName.includes('es krim')
          ) {
            userTeamHistory.set(senderUser, 'biru');
            io.emit('aksi_game', {
              tipe: 'spawn_ksatria_gift',
              fraksi: 'biru',
              namaGift: data.giftName,
              koin: diamondCount,
              pengirim: senderNick,
              username: senderUser,
              waktu: Date.now()
            });
          }

          // 2. Gift Mahal (100+ Koin)
          // Menambah 1 Markas untuk kerajaan yang dibela pengirim gift!
          if (diamondCount >= 100) {
            // Ambil tim yang dibela pengirim, jika tidak ada, beri ke kerajaan dengan markas terendah atau acak
            let timBelaan = userTeamHistory.get(senderUser);
            if (!timBelaan) {
              const tims = ['hijau', 'kuning', 'biru'];
              timBelaan = tims[Math.floor(Math.random() * tims.length)];
            }

            io.emit('aksi_game', {
              tipe: 'tambah_markas_gift_mahal',
              fraksi: timBelaan,
              namaGift: data.giftName,
              koin: diamondCount,
              pengirim: senderNick,
              username: senderUser,
              waktu: Date.now()
            });
          }
        });

        // 6. EVENT STREAM END & DISCONNECT
        tiktok.on('streamEnd', () => {
          console.log(`[TikTok] Siaran @${targetUser} telah berakhir.`);
          io.emit('tiktok_status', {
            status: 'disconnected',
            username: targetUser,
            pesan: `Siaran langsung TikTok @${targetUser} telah selesai.`
          });
          tiktokLiveConnection = null;
        });

        tiktok.on('disconnected', () => {
          console.log(`[TikTok] Terputus dari siaran.`);
          io.emit('tiktok_status', {
            status: 'disconnected',
            username: currentTikTokUsername,
            pesan: 'Terputus dari TikTok Live.'
          });
          tiktokLiveConnection = null;
        });

        tiktok.on('error', (err) => {
          console.error('[TikTok] Kesalahan pada koneksi:', err);
          io.emit('tiktok_error', {
            pesan: `Kesalahan TikTok: ${err.message || 'Terjadi masalah jaringan'}`
          });
        });

      } catch (err) {
        console.error('[TikTok] Gagal menginisialisasi WebcastPushConnection:', err);
        socket.emit('tiktok_error', {
          pesan: `Tidak dapat memulai koneksi: ${err.message}`
        });
      }
    });

    /**
     * MEMUTUSKAN KONEKSI TIKTOK MANUAL
     */
    socket.on('putuskan_tiktok', () => {
      if (tiktokLiveConnection) {
        try {
          tiktokLiveConnection.disconnect();
        } catch (e) {
          console.warn('[TikTok] Gagal disconnect:', e);
        }
        tiktokLiveConnection = null;
      }
      currentTikTokUsername = '';
      io.emit('tiktok_status', {
        status: 'disconnected',
        username: '',
        pesan: 'Koneksi TikTok telah diputuskan secara manual.'
      });
    });

    /**
     * SIMULASI EVENT TIKTOK (UNTUK PENGUJIAN / DEMO STREAMER)
     */
    socket.on('simulasi_event_tiktok', (payload) => {
      console.log('[Simulasi TikTok]', payload);
      io.emit('aksi_game', payload);
    });

    /**
     * GAME MASTER SHORTCUT RELAY (Jika ditekan oleh admin, disinkronkan ke semua layar)
     */
    socket.on('gm_intervensi', (action) => {
      io.emit('aksi_game', action);
    });

    socket.on('disconnect', () => {
      // Klien terputus
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Siap di http://${hostname}:${port}`);
    console.log(`> Tiga Kerajaan vs Monster siap dimainkan!`);
  });
});
