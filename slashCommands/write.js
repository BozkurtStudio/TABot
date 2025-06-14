const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yaz")
    .setDescription("Bota bir şeyler yazdırırsın")
    .addStringOption(option =>
      option.setName("metin")
        .setDescription("Yazılacak metin")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("mesaj_id")
        .setDescription("Yanıt verilecek mesajın ID'si (isteğe bağlı)")
        .setRequired(false)),

  async execute(interaction) {
    const metin = interaction.options.getString("metin");
    const mesajId = interaction.options.getString("mesaj_id");

    if (mesajId) {
      try {
        const hedefMesaj = await interaction.channel.messages.fetch(mesajId);
        await hedefMesaj.reply(metin);
        await interaction.reply({
          content: "✅ Mesaja yanıt olarak gönderildi.",
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "❌ Mesaj bulunamadı.",
          ephemeral: true,
        });
      }
    } else {
      await interaction.channel.send(metin);
      await interaction.reply({
        content: "✅ Mesaj gönderildi.",
        ephemeral: true,
      });
    }
  },
};
