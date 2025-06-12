const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);

  const durumlar = [
    {
      status: "online",
      activity: { name: "porno izliyor", type: 3 },
    },
    {
      status: "idle",
      activity: { name: "kafayı dinliyor", type: 2 },
    },
    {
      status: "dnd",
      activity: { name: "YKS çalışıyor", type: 0 },
    },
    {
      status: "online",
      activity: { name: "Deneme çözüyor", type: 2 },
    },
    {
      status: "idle",
      activity: { name: "Sizi izliyor", type: 3 },
    },
  ];

  function durumGuncelle() {
    const secilen = durumlar[Math.floor(Math.random() * durumlar.length)];
    client.user.setPresence({
      status: secilen.status,
      activities: [secilen.activity],
    });
    console.log("Durum güncellendi:", secilen);
  }

  // Başlangıçta hemen ayarla
  durumGuncelle();

  // Her 5 dakikada bir güncelle (300000 ms)
  setInterval(durumGuncelle, 60 * 1000);
});

client.on("messageCreate", (message) => {
  if (message.content.startsWith("!yaz")) {
    const metin = message.content.slice(5).trim();

    if (!metin) return message.reply("❗ Yazılacak bir metin belirtmelisin.");

    // Eğer komut bir mesaja yanıt olarak yazıldıysa (reply ise)
    if (message.reference) {
      message.channel.messages
        .fetch(message.reference.messageId)
        .then((msg) => {
          msg.reply(metin); // Bot o mesaja yanıt verir
        })
        .catch(console.error);
    } else {
      message.channel.send(metin); // Normal mesaj atar
    }

    // Kullanıcı komut mesajını otomatik silebiliriz (isteğe bağlı)
    if (message.deletable) message.delete();
  }
});

const { Collection } = require("discord.js");



/////////// Medya takip sistemi
const medyaLimitleri = new Collection();
const LIMIT = 5;
const SURE_MS = 60 * 60 * 1000;
const KANAL_ID = "1381741570562199673";

client.on("messageCreate", (message) => {
  if (message.author.bot || !message.guild) return;

  // === MEDYA SPAM ENGELİ ===
  if (message.channel.id !== KANAL_ID) return;
  if (message.attachments.size > 0) {
    const userId = message.author.id;
    const now = Date.now();

    let kullaniciVerisi = medyaLimitleri.get(userId) || [];
    kullaniciVerisi = kullaniciVerisi.filter((zaman) => now - zaman < SURE_MS);

    if (kullaniciVerisi.length >= LIMIT) {
      message.delete().catch(() => {});
      message.channel
        .send({
          content: `**<@${userId}>, bu kanala 1 saat içinde en fazla ${LIMIT} medya gönderebilirsin.**`,
        })
        .then((msg) => {
          setTimeout(() => msg.delete().catch(() => {}), 3000);
        });
      return;
    }

    kullaniciVerisi.push(now);
    medyaLimitleri.set(userId, kullaniciVerisi);
  }
});


client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  // Mesaj içeriğini küçük harfe çevir, baştaki ve sondaki boşlukları kırp
  const msg = message.content.toLowerCase().trim();

  // Kontrollü selamlar
  const selamlar = ["sa", "selam", "selamunaleyküm", "selamun aleyküm", "selamun aleykum", "merhaba", "selamlar"];

  if (selamlar.includes(msg)) {
    message.reply("Aleykümselam, **hoş geldin!**");
  }
});


client.login(process.env.TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif! UptimeRobot buradaydı.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Web sunucusu ${port} portunda çalışıyor`);
});
