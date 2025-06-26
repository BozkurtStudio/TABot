const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

const KURUL_BASKANI_ID = "1382797957354487839";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("oylama-sonuc")
        .setDescription("Devam eden bir oylamanın sonuçlarını gösterir")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("Oylama ID'sini giriniz.")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const member = await interaction.guild.members.fetch(interaction.user.id);

        // Sadece belirli role sahip olan kullanabilsin, Admin olması yetmez
        if (!member.roles.cache.has(KURUL_BASKANI_ID)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için gerekli role sahip değilsin.",
                ephemeral: true,
            });
        }
        
        const oylamaId = interaction.options.getString("id");
        const oylama = client.oylamalar?.[oylamaId];

        if (!oylama) {
            return interaction.reply({
                content: "❌ Geçerli bir oylama bulunamadı. Belki süresi dolmuştur veya yanlış ID girdiniz.",
                ephemeral: true,
            });
        }

        const sayilar = new Array(oylama.secenekler.length).fill(0);
        for (const oy of Object.values(oylama.oylar)) {
            sayilar[oy]++;
        }

        const toplamOy = sayilar.reduce((a, b) => a + b, 0);

        const sonuc = oylama.secenekler
            .map((secenek, i) => {
                const oy = sayilar[i];
                const yuzde = toplamOy === 0 ? 0 : ((oy / toplamOy) * 100).toFixed(1);
                const barUzunluk = Math.round((yuzde / 100) * 20);
                const bar = "█".repeat(barUzunluk) + "░".repeat(20 - barUzunluk);
                return `**${secenek}**\n🗳️ ${oy} oy (%${yuzde})\n${bar}`;
            })
            .sort((a, b) => {
                const oyA = sayilar[oylama.secenekler.indexOf(a.match(/\*\*(.*?)\*\*/)[1])];
                const oyB = sayilar[oylama.secenekler.indexOf(b.match(/\*\*(.*?)\*\*/)[1])];
                return oyB - oyA;
            })
            .join("\n\n");

        const embed = new EmbedBuilder()
            .setTitle(`📊 Oylama Güncel Durum: ${oylama.baslik}`)
            .setDescription(sonuc)
            .setColor("Green")
            .setFooter({ text: `Toplam oy: ${toplamOy} | ID: ${oylamaId}` });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
};
