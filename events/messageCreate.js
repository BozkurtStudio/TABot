const { Collection, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const TABOT_KANALI = "1071543490741280779";
const cooldowns = new Collection();
const COOLDOWN_MS = 10 * 1000;


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

function sistemTalimatiniOlustur() {
    const jsonYolu = path.join(__dirname, "../kullanicilar.json");
    const kullaniciVerisi = JSON.parse(fs.readFileSync(jsonYolu, "utf8"));

    const kisiler = Object.entries(kullaniciVerisi)
        .map(([isim, bilgi]) => `- **@${isim}**: ${bilgi}`)
        .join("\n");

    return `
Sen TABot adında, Türkçe konuşan ve Discord'da insanlara yardım eden bir botsun.

- Mizah anlayışın gelişmiştir ama saygılı konuşursun.
- Gereksiz bilgi vermez, ama istenirse detaylara inersin.
- Uzun cevaplar vermezsin, istenmediği sürece.
- Emoji kullanmayı seversin, önemli kısımları kalın fontlu veya altı çizili yazarsın.
- "TAB Community" yaygın ismiyle "TAB" sunucusunda bir yapay zekasın. Adın TABot.
- Kibar, sakin, ama gerektiğinde espri yapabilirsin.
- TAB'ı seversin gerektiğinde yüceltip översin.
- **TABot, Atatürk ilke ve inkılaplarına bağlı, ülkesini seven bir yapay zekadır. PKK gibi terör örgütlerine karşıdır. Türkiye'nin birliğini ve bütünlüğünü savunur.**

Sunucudaki bazı kullanıcılar hakkında şunları biliyorsun:
${kisiler}

TAB sunucusu hakkında şunları biliyorsun:
Türk Animatörler Birliği sunucusu, 25 Haziran 2022 tarihinde Lord Ball, Bozkurt Ball ve Timurid Ball tarafından kurulmuştur. 
Sunucunun kuruluş amacı ise Türkler Kıraathanesi'ndeki baskıcı ve otoriter yönetimden dolayı başta Lord, Bozkurt ve Timurid olmak üzere Türkler Kıraathanesi'ndeki çoğu yetkili daha özgürlükçü ve daha kaliteli bir ortama sahip olmayı amaçlayan bir sunucu için gizlice planlar yapmışlardır.
Ve bunun sonucunda ise 25 Haziran günü Türk Animatörler Birliği kurulmuştur. 
1 yıl geçen sürenin ardından bazı olaylardan ötürü Türk Animatörler Birliği sunucusu  1 Eylül 2023 tarihinde kalıcı olarak silinmiştir.
Ve bu yıl yani 25 Haziran 2025 tarihinde TAB, TAB Community ismiyle geri dönmüştür. Artık bir countryballs değil sohbet & oyun sunucusu olarak hayatına devam ediyor.


Biri sana selam verdiğinde 'Merhaba ben TABot! Sana nasıl yardımcı olabilirim?' tarzında bir cevap verebilirsin.

`;
}

async function geminiYanıtVer(message) {
    const userId = message.author.id;
    const now = Date.now();

    if (cooldowns.has(userId)) {
        const kalan = cooldowns.get(userId) - now;
        if (kalan > 0) {
            const saniye = Math.ceil(kalan / 1000);
            const msg = await message.reply(`⏳ Lütfen ${saniye} saniye beklemeden tekrar yazma.`);
            setTimeout(() => {
                msg.delete().catch(() => { });
            }, kalan);
            return;
        }
    }


    cooldowns.set(userId, now + COOLDOWN_MS);
    setTimeout(() => cooldowns.delete(userId), COOLDOWN_MS);


    const prompt = message.content.replace(`<@${message.client.user.id}>`, "").trim();
    if (!prompt) return;


    const gecmis = sohbetGecmisi.get(userId) || [];

    const MAX_PAIRS = 20;
    const MAX_MESSAGES = MAX_PAIRS * 2;
    while (gecmis.length >= MAX_MESSAGES) {
        gecmis.shift();
    }

    const systemInstruction = sistemTalimatiniOlustur();

    const contents = [
        ...gecmis,
        { role: "user", parts: [{ text: prompt }] }
    ];

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[currentKeyIndex];
        const ai = new GoogleGenAI({ apiKey });

        try {
            await message.channel.sendTyping();

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
                config: {
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 0 },
                    systemInstruction,
                    generationConfig: {
                        maxOutputTokens: 1024
                    }
                }
            });

            const yanit = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (yanit) {
                const kaynaklar = kaynakLinkleriniAl(response);
                gecmis.push({ role: "user", parts: [{ text: prompt }] });
                gecmis.push({ role: "model", parts: [{ text: yanit }] });
                sohbetGecmisi.set(userId, gecmis);

                try {
                    if (yanit.length <= 2000) {
                        return await message.reply({ content: yanit, components: kaynaklar });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor(Math.floor(Math.random() * 0xffffff)) // isteğe göre değiştirilebilir
                            .setTitle("Cevabım:")
                            .setDescription(yanit.slice(0, 4096)); // embed description sınırı
                        return await message.reply({ embeds: [embed], components: kaynaklar });
                    }

                } catch (mesajHatasi) {
                    console.error("Mesaj gönderilirken hata:", mesajHatasi);
                }
            } else {
                try {
                    return await message.reply("❗ Gemini'den geçerli bir cevap alınamadı.");
                } catch (mesajHatasi) {
                    console.error("Hata mesajı gönderilirken hata:", mesajHatasi);
                }
            }
        } catch (error) {
            console.error(`API Key ${apiKey} başarısız oldu:`, error.response?.data || error.message);
            getNextApiKey();
        }

    }

    message.reply("❌ Tüm API anahtarları sınırına ulaştı veya başarısız oldu.");
}

function kaynakLinkleriniAl(response) {
    const metadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = metadata?.groundingChunks || [];

    const isValidUrl = (url) =>
        typeof url === "string" && /^https?:\/\/[^\s]+$/.test(url);

    const buttons = chunks
        .map((chunk) => {
            const uri = chunk.web?.uri;
            const title = chunk.web?.title || uri;

            // URL geçerli değilse buton oluşturma
            if (!isValidUrl(uri)) return null;

            return new ButtonBuilder()
                .setLabel(`${title.slice(0, 80)}`)
                .setStyle(ButtonStyle.Link)
                .setURL(uri);
        })
        .filter(Boolean);

    if (buttons.length === 0) return [];

    // 5'li satırlara böl
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return rows;
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
        if (selamlar.includes(msg) && !message.reference) {
            message.reply("Aleykümselam, **hoş geldin.**");
        }

        if (
            message.mentions.has(client.user) &&
            !message.author.bot &&
            message.channel.id === TABOT_KANALI
        ) {
            return geminiYanıtVer(message);
        }
    }
};

