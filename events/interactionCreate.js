const {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const { saveOylamalar } = require("../jsonbin");

// Buraya rol ID'sini yaz
const KONGRE_ROL_ID = "1381733725800366132"; 

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (command) await command.execute(interaction, client);
    }

    if (interaction.isButton()) {
      // === Oy kullan butonu ===
      if (interaction.customId.startsWith("oyla_")) {
        const oylamaId = interaction.customId.replace("oyla_", "");
        const oylama = client.oylamalar?.[oylamaId];

        if (!oylama) {
          return interaction.reply({
            content: "⌛ Bu oylamanın süresi dolmuş olabilir.",
            ephemeral: true,
          });
        }

        if (oylama.oylar[interaction.user.id] !== undefined) {
          return interaction.reply({
            content: "❌ Zaten oy kullandınız.",
            ephemeral: true,
          });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(KONGRE_ROL_ID)) {
          return interaction.reply({
            content: "❌ Bu oylamaya katılmak için Kongre Üyesi olmalısın.",
            ephemeral: true,
          });
        }

        const buttons = oylama.secenekler.map((secenek, i) =>
          new ButtonBuilder()
            .setCustomId(`vote_${i}_${oylamaId}`)
            .setLabel(secenek)
            .setStyle(ButtonStyle.Secondary)
        );

        // Butonları 5'erli satırlara böl
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
          const slice = buttons.slice(i, i + 5);
          if (slice.length > 0) {
            rows.push(new ActionRowBuilder().addComponents(slice));
          }
        }

        const embed = {
          title: "🗳️ Oy Sandığı",
          description: `Aşağıdan bir seçeneğe tıklayarak oy kullanabilirsin.\n\n**🔒 Oy verdikten sonra tekrar değiştiremezsin.**`,
          color: Math.floor(Math.random() * 0xffffff)
        };

        return interaction.reply({
          embeds: [embed],
          components: rows,
          ephemeral: true,
        });
      }

      // === Seçenek oyu ===
      if (interaction.customId.startsWith("vote_")) {
        const [, index, oylamaId] = interaction.customId.split("_");
        const oylama = client.oylamalar?.[oylamaId];

        if (!oylama) {
          return interaction.reply({
            content: "Bu oylama artık geçerli değil.",
            ephemeral: true,
          });
        }

        if (oylama.oylar[interaction.user.id] !== undefined) {
          return interaction.reply({
            content: "❌ Zaten oy kullandın.",
            ephemeral: true,
          });
        }

        oylama.oylar[interaction.user.id] = parseInt(index);
        await saveOylamalar(client.oylamalar);

        const embed = {
          title: "✅ Oy verildi",
          description: `Seçimin: **${oylama.secenekler[index]}**`,
          color: 0x57f287, // Yeşil
        };

        return interaction.update({
          embeds: [embed],
          components: [], // Butonları kaldır
        });
      }

    }
  },
};
