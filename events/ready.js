module.exports = {
    execute(client) {
        console.log(`Bot giriş yaptı: ${client.user.tag}`);

        client.user.setPresence({
            status: "idle",
            activities: [{ name: "TAB Community", type: 3 }]
        });

        /*
        const durumlar = [
          { status: "online", activity: { name: "", type: 3 } },
          { status: "idle", activity: { name: "TAB Community", type: 3 } },
        ];
    
        function durumGuncelle() {
          const secilen = durumlar[Math.floor(Math.random() * durumlar.length)];
          client.user.setPresence({
            status: secilen.status,
            activities: [secilen.activity],
          });
          console.log("Durum güncellendi:", secilen);
        }
    
        durumGuncelle();
        setInterval(durumGuncelle, 5 * 60 * 1000);
        */
    }
};
