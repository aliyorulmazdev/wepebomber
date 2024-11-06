const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");

// Dualar
const kulhuvallah = `قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾`;
const elham = `الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾`;

// Random delay için yardımcı fonksiyon (1-2 saniye arası)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * 1000) + 1000;

// WhatsApp client'ı oluştur
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox"],
  },
});

// QR kod gösterildiğinde
client.on("qr", (qr) => {
  console.log("QR Kodu taratın:");
  qrcode.generate(qr, { small: true });
});

// Dosyadan mesajı oku
function readMessageTemplate() {
  try {
    return fs.readFileSync(path.join(__dirname, "message.txt"), "utf8").trim();
  } catch (err) {
    console.error("message.txt dosyası okunamadı:", err.message);
    process.exit(1);
  }
}

// Dua okuma fonksiyonu
async function readPrayers() {
  console.log("\n=== Dualar Okunuyor ===\n");

  // 3 Kulhuvallah
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- ${i}. Kulhuvallah ---`);
    console.log(kulhuvallah);
    await sleep(1000); // Her dua arasında 1 saniye bekle
  }

  // 1 Elham
  console.log("\n--- Elham ---");
  console.log(elham);
  await sleep(1000);

  console.log("\n=== Dualar Tamamlandı ===\n");
}

// Client hazır olduğunda
client.on("ready", async () => {
  console.log("Client hazır!");

  try {
    // Önce duaları oku
    await readPrayers();

    // Mesaj şablonunu oku
    const messageTemplate = readMessageTemplate();
    console.log("Mesaj şablonu okundu.");

    // Numaraları dosyadan oku
    const numbers = fs
      .readFileSync(path.join(__dirname, "numbers.txt"), "utf8")
      .split("\n")
      .map((num) => num.trim())
      .filter((num) => num);

    console.log(`${numbers.length} numara bulundu.`);

    // Her numara için mesaj gönder
    for (const number of numbers) {
      try {
        // Mesajı hazırla
        const currentDate = new Date().toLocaleString("tr-TR");
        const message = messageTemplate.replace("{date}", currentDate);

        // Mesajı gönder
        const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`Mesaj gönderildi: ${number}`);

        // Random delay ekle
        const delay = randomDelay();
        console.log(`${delay}ms bekleniyor...`);
        await sleep(delay);
      } catch (err) {
        console.error(`${number} numarasına mesaj gönderilemedi:`, err.message);
      }
    }

    console.log("Tüm mesajlar gönderildi.");
    await client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("Bir hata oluştu:", err);
    await client.destroy();
    process.exit(1);
  }
});

// Hata yakalama
client.on("auth_failure", (msg) => {
  console.error("Kimlik doğrulama hatası:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Client bağlantısı kesildi:", reason);
});

// Client'ı başlat
client.initialize();
