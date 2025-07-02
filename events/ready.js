const { getOylamalar } = require("../jsonbin");

module.exports = {
    async execute(client) {
        console.log(`Bot giriş yaptı: ${client.user.tag}`);

        // Oylamaları JSONBin'den yükle
        client.oylamalar = await getOylamalar();
        console.log("✅ Oylamalar JSONBin'den yüklendi");

        
        const durumlar = [
          { status: "idle", activity: { name: "Bana bir şeyler sor! 💫", type: 0 } },
          { status: "idle", activity: { name: "TAB Community", type: 3 } },
        ];
    
        function durumGuncelle() {
          const secilen = durumlar[Math.floor(Math.random() * durumlar.length)];
          client.user.setPresence({
            status: secilen.status,
            activities: [secilen.activity],
          });
        }
    
        durumGuncelle();
        setInterval(durumGuncelle, 5 * 60 * 1000);
        
    }
};
