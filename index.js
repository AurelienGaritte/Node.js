// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const motsCles = `"Orange SA" OR "Consol Energy" OR "CEIX" OR "Mo-Bruk SA" OR "MBR.WA" OR "Nak Sealing Technologies Corp" OR "9942.TW" OR "Mastercard Inc" OR "Visa Inc" OR "ASML Holding NV" OR "S&P500" OR "USDA" OR "Rana Gruber" OR "RANA.OL" OR "XETRA-GOLD" OR "4 GLD" OR "TSMC" OR "Zengame Technology" OR "Hemisphere Energy" OR "Interactive Brokers" OR ORA OR HME OR IBKR`;

const motsClesArray = [...new Set(
  motsCles
    .split("OR")
    .map((el) => el.trim().replace(/^"|"$/g, ""))
    .filter((el) => el.length > 1)
)];

const sendDailyGreeting = async () => {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  await channel.send("🌞 Salut trader en herbe, prêt pour une nouvelle journée enrichissante ? 💸📈");
};

const sendEveningMessage = async () => {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  await channel.send("🌙 Bonne soirée, reposez-vous bien, l'aventure continue ! 😴📊");
};

const getMarketNews = async () => {
  try {
    const response = await axios.get("https://api.marketaux.com/v1/news/all", {
      params: {
        api_token: process.env.MARKETAUX_KEY,
        language: "en,fr",
        sort_by: "published_desc",
        limit: 20,
      },
    });
    return response.data.data || [];
  } catch (error) {
    console.error("❌ Erreur dans la récupération des news :", error);
    return [];
  }
};

const postMarketNews = async () => {
  const articles = await getMarketNews();
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  let newsPosted = false;

  for (const article of articles) {
    const motsTrouvés = motsClesArray.filter((mot) =>
      article.title?.includes(mot) || article.description?.includes(mot)
    );

    if (motsTrouvés.length > 0) {
      newsPosted = true;
      for (const mot of motsTrouvés) {
        const langue = article.language === "fr" ? "🇫🇷" : "🇺🇸";
        await channel.send(
          `📢 Nouvelle news sur **${mot}** ${langue} !\n📰 ${article.title}\n🔗 ${article.url}`
        );
      }
    }
  }

  if (!newsPosted) {
    await channel.send("📭 Aucune actualité trouvée pour les sujets suivis. 💤");
  }

  if (process.env.AUTO_EXIT === "true") {
    console.log("✅ Fin du job, arrêt automatique du bot.");
    setTimeout(() => process.exit(0), 60 * 1000);
  }
};

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  if (message.content.startsWith("!clear")) {
    const count = parseInt(message.content.replace("!clear", "").trim()) || 10;

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("🚫 Tu n'as pas la permission de supprimer des messages.");
    }

    try {
      await message.channel.bulkDelete(count, true);
      message.channel.send(`🧹 ${count} messages supprimés !`).then((msg) => {
        setTimeout(() => msg.delete(), 3000);
      });
    } catch (err) {
      console.error("Erreur lors de la suppression de messages:", err);
      message.channel.send("❌ Une erreur est survenue lors de la suppression.");
    }
  }
});

client.once("ready", async () => {
  console.log("🤖 Bot en ligne et prêt !");
  await sendDailyGreeting();
  postMarketNews();

  cron.schedule("0 10 * * *", async () => {
    await sendDailyGreeting();
    await postMarketNews();
  });

  cron.schedule("0 14 * * *", postMarketNews);

  cron.schedule("0 18 * * *", async () => {
    await postMarketNews();
    await sendEveningMessage();
  });
});

client.login(process.env.TOKEN);
