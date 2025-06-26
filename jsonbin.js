require("dotenv").config();
const fetch = require("node-fetch");

const API_KEY = process.env.JSONBIN_API_KEY;
const BIN_ID = process.env.JSONBIN_BIN_ID;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Oylamaları JSONBin'den al
async function getOylamalar() {
    try {
        const res = await fetch(`${BASE_URL}/latest`, {
            headers: { "X-Master-Key": API_KEY }
        });
        const json = await res.json();
        return json.record || {};
    } catch (err) {
        console.error("❌ JSONBin'den veri alınamadı:", err);
        return {};
    }
}

// Oylamaları JSONBin'e kaydet
async function saveOylamalar(data) {
    try {
        await fetch(BASE_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("❌ JSONBin'e veri kaydedilemedi:", err);
    }
}

module.exports = {
    getOylamalar,
    saveOylamalar
};
