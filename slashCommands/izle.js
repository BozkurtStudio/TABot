const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const crypto = require("crypto");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birlikte-izle")
    .setDescription("Birlikte izleme odası kurar"),

  async execute(interaction) {
    const roomId = crypto.randomBytes(4).toString("hex");
    const adminKey = crypto.randomBytes(3).toString("hex");

    // Odayı belleğe kaydet
    global.rooms = global.rooms || {};
    global.rooms[roomId] = {
      adminKey,
      adminSocketId: null,
      videoUrl: null
    };

    const watchLink = `http://localhost:3000/watch?room=${roomId}`;

     const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎬 Odanız Hazır")
      .setDescription(`**Admin Şifresi:** \`${adminKey}\`\n[Buraya tıklayarak](${watchLink}) izleme odasına katılabilirsin.`);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  },
};
