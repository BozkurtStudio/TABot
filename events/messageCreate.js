const { Collection, EmbedBuilder, PermissionsBitField } = require("discord.js");
const axios = require("axios");

const medyaLimitleri = new Collection();
const LIMIT = 5;
const SURE_MS = 60 * 60 * 1000;
const KANAL_ID = "1381741570562199673";

const GEMINI_MODEL = "gemini-2.5-flash"; 

const apiKeys = [
    "AIzaSyDcZ753lRqIl8Oa79cSrFcCfYS8fQ8QLjI",
    "AIzaSyDCmPm12FwQVYrBXjb8esaexCH2jf4rdWo",
    "AIzaSyCqWGBEKe3OIqkYhFOMYCMg0v4b7R6VaHU"
];

let currentKeyIndex = 0;

function getNextApiKey() {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return apiKeys[currentKeyIndex];
}


const sohbetGecmisi = new Map(); // userId → geçmiş dizisi

async function geminiYanıtVer(message) {
    const prompt = message.content.replace(`<@${message.client.user.id}>`, "").trim();
    if (!prompt) return;

    const userId = message.author.id;
    const gecmis = sohbetGecmisi.get(userId) || [];

    // Yeni kullanıcı mesajını geçmişe ekle
    gecmis.push({ role: "user", parts: [{ text: prompt }] });

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[currentKeyIndex];

        try {
            await message.channel.sendTyping();

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
                { contents: gecmis },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-goog-api-key": apiKey
                    }
                }
            );

            const yanit = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (yanit) {
                // Modelin cevabını geçmişe ekle
                gecmis.push({ role: "model", parts: [{ text: yanit }] });
                sohbetGecmisi.set(userId, gecmis);

                message.reply(yanit.slice(0, 2000));
            } else {
                message.reply("❗ Gemini'den cevap alınamadı.");
            }
            return; // Başarılıysa döngüyü kır
        } catch (error) {
            console.error(`API Key ${apiKey} başarısız oldu, diğerine geçiliyor...`, error.response?.data || error.message);
            getNextApiKey();
        }
    }

    message.reply("❌ Günlük istek sınırına ulaşıldı veya tüm API key'ler başarısız oldu.");
}


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
            if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
            
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

