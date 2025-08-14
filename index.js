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


client.login(process.env.TOKEN).catch(err => {
  console.error("Discord login failed:", err);
  // process.exit() YAPMA! Yoksa Render portu kaybeder.
});


