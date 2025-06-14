const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif! UptimeRobot buradaydı.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Web sunucusu ${port} portunda çalışıyor`);
});
