 const { Client, GatewayIntentBits, Collection } = require("discord.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates

  ],
});

// Client tanımlamandan hemen sonrasına ekle:

client.on("debug", (info) => console.log(`[DEBUG] ${info}`));
client.on("warn", (info) => console.log(`[UYARI] ${info}`));
client.on("error", (error) => console.error(`[HATA] ${error}`));

// ... sonra diğer kodların gelsin
client.slashCommands = new Collection();

// Slash komutları yükle
const slashFiles = fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"));
for (const file of slashFiles) {
  const command = require(`./slashCommands/${file}`);
  client.slashCommands.set(command.data.name, command);
}

client.commands = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Eventleri yükle
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  const eventName = file.split(".")[0];
  client.on(eventName, (...args) => event.execute(...args, client));
}

// Web sunucusu (uptime için)

require("./uptime");
// HATA AYIKLAMA KODU BAŞLANGICI
if (!process.env.TOKEN) {
    console.error("KRİTİK HATA: 'TOKEN' çevre değişkeni bulunamadı! Render Environment ayarlarını kontrol et.");
} else {
    console.log("Token değişkeni bulundu, giriş deneniyor...");
}
// HATA AYIKLAMA KODU BİTİŞİ

client.login(process.env.TOKEN).then(() => {
    console.log("Giriş Başarılı! (Main dosyasından onaylandı)");
}).catch(err => {
    console.error("Discord login failed:", err);
});


