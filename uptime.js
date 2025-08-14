const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

// Statik dosya sunumu (video.html için)
app.use(express.static(__dirname));

// Basit uptime testi
app.get("/", (req, res) => {
  res.send("Bot aktif! UptimeRobot buradaydı.");
});

// Video izleme arayüzü
app.get("/watch", (req, res) => {
  res.sendFile(path.join(__dirname, "video.html"));
});

// Oda mantığı ve video senkronizasyonu
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, password }) => {
    const room = global.rooms?.[roomId];
    if (!room) return;

    socket.join(roomId);

    // Admin ataması
    if (!room.adminSocketId && password === room.adminKey) {
      room.adminSocketId = socket.id;
      delete room.adminKey;
      socket.emit("admin-granted");
      console.log(`Admin atandı: ${socket.id}`);
    } else {
      console.log(`Katılan: ${socket.id} (kullanıcı)`);
    }

    if (room.videoUrl) {
      socket.emit("load-video", { videoUrl: room.videoUrl });
    }
  });

  socket.on("video-event", ({ roomId, type, currentTime }) => {
    const room = global.rooms?.[roomId];
    if (room?.adminSocketId === socket.id) {
      socket.to(roomId).emit("video-event", { type, currentTime });
    }
  });

  socket.on("change-video", ({ roomId, newUrl }) => {
    const room = global.rooms?.[roomId];

    // Admin kontrolü
    if (room?.adminSocketId === socket.id) {
      // Sadece geçerli URL'leri kabul et (örnek: http veya https ile başlamalı)
      try {
        const parsed = new URL(newUrl);
        room.videoUrl = newUrl;
        io.to(roomId).emit("load-video", { videoUrl: newUrl });
      } catch (err) {
        console.log("Geçersiz URL formatı:", newUrl);
      }
    }
  });

  socket.on("sync-status", ({ roomId, currentTime, paused }) => {
    const room = global.rooms?.[roomId];
    if (room?.adminSocketId === socket.id) {
      socket.to(roomId).emit("sync-status", { currentTime, paused });
    }
  });

  socket.on("disconnect", () => {
    // Tüm odaları kontrol et
    if (!global.rooms) return;

    for (const [roomId, room] of Object.entries(global.rooms)) {
      if (room.adminSocketId === socket.id) {
        // Odayı kapat
        io.to(roomId).emit("room-closed");
        delete global.rooms[roomId];
        console.log(`Admin ayrıldı, oda kapatıldı: ${roomId}`);
      }
    }
  });

});

// Sunucuyu başlat
server.listen(port, "0.0.0.0", () => {
  console.log(`Web sunucusu ${port} portunda çalışıyor`);
});
