require("dotenv").config(); // <--- BUNU EKLE

const { REST, Routes } = require("discord.js");
const { client_id, guild_id, token } = process.env;
const fs = require("fs");

const commands = [];

const commandFiles = fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slashCommands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("⏳ Slash komutlar yükleniyor...");

    await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
      body: commands,
    });

    console.log("✅ Slash komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error("❌ Slash komut yüklenemedi:", error);
  }
})();
