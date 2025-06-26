const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { bitirOylama } = require("./oylama");


const KURUL_BASKANI_ID = "1382797957354487839";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oylama-bitir")
    .setDescription("Devam eden bir oylamayı bitirir")
    .addStringOption((opt) =>
      opt.setName("id").setDescription("Oylama ID'si").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction, client) {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(KURUL_BASKANI_ID)) {
      return interaction.reply({
        content: "❌ Bu komutu kullanmak için gerekli role sahip değilsin.",
        ephemeral: true,
      });
    }

    const id = interaction.options.getString("id");

    if (!client.oylamalar?.[id]) {
      return interaction.reply({
        content: "❌ Bu ID ile aktif bir oylama yok.",
        ephemeral: true,
      });
    }

    if (client.oylamalar[id].bitirildi) {
      return interaction.reply({
        content: "⚠️ Bu oylama zaten bitirilmiş.",
        ephemeral: true,
      });
    }

    await bitirOylama(id, client, interaction.guild);
    return interaction.reply({ content: "✅ Oylama bitirildi." });
  },
};
