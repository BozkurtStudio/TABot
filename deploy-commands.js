require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { CLIENT_ID, GUILD_ID, TOKEN } = process.env;
const fs = require("fs");

const commands = [];

const commandFiles = fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slashCommands/${file}`);
  commands.push(command.data.toJSON());
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

