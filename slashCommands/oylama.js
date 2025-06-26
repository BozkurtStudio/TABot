const {
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const { saveOylamalar } = require("../jsonbin");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("oylama")
        .setDescription("Kapalı bir oylama başlatır")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption((opt) =>
            opt.setName("baslik").setDescription("Oylamanın başlığı").setRequired(true)
        )
        .addStringOption((opt) =>
            opt
                .setName("secenekler")
                .setDescription("Virgülle ayırarak seçenekleri yaz")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("saat")
                .setDescription("Oylama süresi (saat)")
                .setMinValue(0)
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("dakika")
                .setDescription("Oylama süresi (dakika)")
                .setMinValue(0)
                .setMaxValue(59)
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const baslik = interaction.options.getString("baslik");
        const secenekler = interaction.options
            .getString("secenekler")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .slice(0, 25)

        if (secenekler.length < 2) {
            return interaction.reply({
                content: "En az 2 seçenek belirtmelisin.",
                ephemeral: true,
            });
        }
        if (secenekler.length > 25) {
            return interaction.reply({
                content: "⚠️ En fazla 25 seçenek girebilirsin.",
                ephemeral: true,
            });
        }

        const saat = interaction.options.getInteger("saat");
        const dakika = interaction.options.getInteger("dakika");
        const sureMs = (saat * 60 + dakika) * 60 * 1000;
        const oylamaId = Date.now().toString();
        client.oylamalar ??= {};
        client.oylamalar[oylamaId] = {
            secenekler,
            oylar: {},
            kanalId: interaction.channelId,
            mesajId: null,
            bitirildi: false,
            baslik
        };

        await saveOylamalar(client.oylamalar);

        // Süre mesajını düzgün şekilde oluştur
        let sureMetni = "";
        if (saat > 0 && dakika > 0) {
            sureMetni = `${saat} saat ${dakika} dakika`;
        } else if (saat > 0) {
            sureMetni = `${saat} saat`;
        } else if (dakika > 0) {
            sureMetni = `${dakika} dakika`;
        } else {
            sureMetni = `anında sona erecek`;
        }

        const embed = new EmbedBuilder()
            .setTitle(baslik)
            .setDescription(`🔽 Oy vermek için butona tıklayın.\n\n⏳ Süre: **${sureMetni}**`)
            .setColor("#a12b2b")
            .setFooter({ text: `ID: ${oylamaId}` });

        const button = new ButtonBuilder()
            .setCustomId(`oyla_${oylamaId}`)
            .setLabel("Oy kullan")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🗳️")

        const row = new ActionRowBuilder().addComponents(button);

        const reply = await interaction.reply({ embeds: [embed], components: [row] });

        client.oylamalar[oylamaId].mesajId = (await reply.fetch()).id;


        // Otomatik bitirme
        setTimeout(async () => {
            if (client.oylamalar[oylamaId]?.bitirildi) return;
            await bitirOylama(oylamaId, client, interaction.guild);
        }, sureMs);

    },
};

async function bitirOylama(oylamaId, client, guild) {
    const oylama = client.oylamalar?.[oylamaId];
    if (!oylama) return;

    oylama.bitirildi = true;

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
            return {
                secenek,
                oy,
                yuzde,
                bar
            };
        })
        .sort((a, b) => b.oy - a.oy) // Burada sıralama ekliyoruz
        .map(({ secenek, oy, yuzde, bar }) => {
            return `**${secenek}**\n🗳️ ${oy} oy (%${yuzde})\n${bar}`;
        })
        .join("\n\n");


    const kanal = await guild.channels.fetch(oylama.kanalId);
    if (kanal) {
        kanal.send({
            content: `📊 **${oylama.baslik}** sona erdi.`,
            embeds: [
                new EmbedBuilder()
                    .setTitle("Sonuçlar")
                    .setDescription(sonuc)
                    .setColor("Green")
                    .setFooter({ text: `Toplam Oy: ${toplamOy}` }),
            ],
        });
    }

    delete client.oylamalar[oylamaId];
    await saveOylamalar(client.oylamalar);
}


module.exports.bitirOylama = bitirOylama;
