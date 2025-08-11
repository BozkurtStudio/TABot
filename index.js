// =================================================================
// [LOG 1] Script başlıyor. Gerekli kütüphaneler yükleniyor...
console.log('[LOG 1] Script başlıyor. Gerekli kütüphaneler yükleniyor...');

const { Client, GatewayIntentBits, Collection } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// =================================================================
// [LOG 2] Genel hata yakalayıcılar ekleniyor.
console.log('[LOG 2] Genel hata yakalayıcılar ekleniyor.');

process.on('unhandledRejection', error => {
	console.error('[HATA] Yakalanamayan bir Promise hatası (unhandledRejection):', error);
});

process.on('uncaughtException', error => {
    console.error('[HATA] Yakalanamayan bir istisna (uncaughtException):', error);
});

client.on('error', error => {
    console.error('[HATA] Discord Client bir hata fırlattı:', error);
});

// =================================================================
// [LOG 3] Distube müzik modülü yükleniyor...


// =================================================================
// [LOG 5] Komut koleksiyonları oluşturuluyor...
console.log('[LOG 5] Komut koleksiyonları oluşturuluyor...');
client.slashCommands = new Collection();
client.commands = new Collection();

// =================================================================
// [LOG 6] Slash komutları yükleniyor...
console.log('[LOG 6] Slash komutları yükleniyor...');
try {
  const slashFiles = fs.readdirSync("./slashCommands").filter(file => file.endsWith(".js"));
  for (const file of slashFiles) {
    const command = require(`./slashCommands/${file}`);
    client.slashCommands.set(command.data.name, command);
  }
  console.log(`[LOG 7] Slash komutları başarıyla yüklendi. Toplam: ${client.slashCommands.size} adet.`);
} catch (err) {
  console.error('[HATA] Slash komutları yüklenirken bir hata oluştu:', err);
}

// =================================================================
// [LOG 8] Prefix komutları yükleniyor...
console.log('[LOG 8] Prefix komutları yükleniyor...');
try {
  const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
  }
  console.log(`[LOG 9] Prefix komutları başarıyla yüklendi. Toplam: ${client.commands.size} adet.`);
} catch (err) {
  console.error('[HATA] Prefix komutları yüklenirken bir hata oluştu:', err);
}

// =================================================================
// [LOG 10] Eventler yükleniyor...
console.log('[LOG 10] Eventler yükleniyor...');
try {
  const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, (...args) => event.execute(...args, client));
  }
  console.log(`[LOG 11] Eventler başarıyla yüklendi. Toplam: ${eventFiles.length} adet.`);
} catch (err) {
  console.error('[HATA] Eventler yüklenirken bir hata oluştu:', err);
}

// =================================================================
// [LOG 12] Uptime web sunucusu başlatılıyor...
console.log('[LOG 12] Uptime web sunucusu başlatılıyor...');
try {
  require("./uptime");
  console.log('[LOG 13] Uptime web sunucusu başarıyla yüklendi/başlatıldı.');
} catch (err) {
  console.error('[HATA] Uptime sunucusu başlatılırken bir hata oluştu:', err);
}

// =================================================================
// [LOG 14] Discord'a giriş yapılıyor...
console.log('[LOG 14] Discord\'a giriş yapılıyor (client.login)...');

// Son kontrol: Token var mı?
if (!process.env.TOKEN) {
    console.error('[HATA] TOKEN ortam değişkeni bulunamadı veya boş! Lütfen Render ayarlarınızı kontrol edin.');
} else {
    client.login(process.env.TOKEN)
      .catch(err => {
        console.error('[HATA] client.login() işlemi başarısız oldu. Token geçersiz veya ağ sorunu olabilir.', err.message);
      });
}

// =================================================================
// [LOG 15] Bot hazır olduğunda çalışacak event ayarlandı.
client.once('ready', () => {
    console.log(`\n\n[BAŞARILI] Bot hazır! ${client.user.tag} olarak giriş yapıldı!\n\n`);
});

