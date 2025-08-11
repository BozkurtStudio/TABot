require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;
const fs = require("fs");

const commands = [];

// Slash komut dosyalarını oku
try {
  const commandFiles = fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(`./slashCommands/${file}`);
      commands.push(command.data.toJSON());
    } catch (err) {
      console.error(`❌ Komut dosyası yüklenemedi (${file}):`, err);
    }
  }
} catch (err) {
  console.error("❌ Slash komut dosyaları okunurken hata:", err);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("⏳ Slash komutlar yükleniyor...");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("✅ Slash komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error("❌ Slash komut yüklenemedi:", error);
  }
})();

// Global hata yakalama (beklenmeyen hatalar)
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});


