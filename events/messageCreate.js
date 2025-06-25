const { Collection, EmbedBuilder, PermissionsBitField } = require("discord.js");

const medyaLimitleri = new Collection();
const LIMIT = 5;
const SURE_MS = 60 * 60 * 1000;
const KANAL_ID = "1381741570562199673";

module.exports = {
    async execute(message, client) {
        if (message.author.bot) return;

        const prefix = "!";
        if (message.content.startsWith(prefix)) {
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = client.commands.get(commandName);
            if (command) command.execute(message, args);
        }

        // Selam kontrolü
        const msg = message.content.toLowerCase().trim();
        const selamlar = ["sa", "selam", "selamunaleyküm", "selamun aleyküm", "selamun aleykum", "merhaba", "selamlar"];
        if (selamlar.includes(msg)) {
            message.reply("Aleykümselam, **hoş geldin.**");
        }

        // ===== Medya spam engeli =====
        if (message.channel.id === KANAL_ID && message.attachments.size > 0) {
            if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
            
            const userId = message.author.id;
            const now = Date.now();

            let kullaniciVerisi = medyaLimitleri.get(userId) || [];
            kullaniciVerisi = kullaniciVerisi.filter(zaman => now - zaman < SURE_MS);

            if (kullaniciVerisi.length >= LIMIT) {
                message.delete().catch(() => { });
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000) // Kırmızı renk
                    .setTitle("⚠️ Medya Limiti Aşıldı")
                    .setDescription(`<@${userId}>, bu kanala **1 saat** içinde en fazla **${LIMIT} medya** gönderebilirsin.`)
                    .setTimestamp();
                message.channel.send({ embeds: [embed] }).then((msg) => {
                    setTimeout(() => msg.delete().catch(() => { }), 3000);
                });
                return;
            }

            kullaniciVerisi.push(now);
            medyaLimitleri.set(userId, kullaniciVerisi);
        }
    }
};


