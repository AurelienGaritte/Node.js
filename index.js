const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`📈 Bot boursier connecté en tant que ${client.user.tag}`);

  // Lancer la première récupération
  postMarketNews();

  // Puis toutes les heures
  setInterval(postMarketNews, 1000 * 60 * 60);
});

async function postMarketNews() {
  try {
    // Mots-clés optimisés
    const motsCles = `"Orange SA" OR "Hemisphere Energy" OR "Cardano" OR "ETH" OR "Ethereum" OR "Interactive Brokers" OR ORA OR HME OR TFI OR IBKR`;

    // News FR + EN
    const urls = [
      {
        lang: 'fr',
        url: `https://newsapi.org/v2/everything?q=${encodeURIComponent(motsCles)}&language=fr&sortBy=publishedAt&apiKey=${process.env.NEWSAPI_KEY}`
      },
      {
        lang: 'en',
        url: `https://newsapi.org/v2/everything?q=${encodeURIComponent(motsCles)}&language=en&sortBy=publishedAt&apiKey=${process.env.NEWSAPI_KEY}`
      }
    ];

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    let totalArticles = 0;

    for (const source of urls) {
      const res = await axios.get(source.url);
      const articles = res.data.articles.slice(0, 2);

      if (articles.length === 0) {
        await channel.send(`🔍 Aucune actualité trouvée en ${source.lang === 'fr' ? 'français' : 'anglais'}.`);
        continue;
      }

      for (const article of articles) {
        const langue = source.lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 Anglais';
        await channel.send(`📰 **${article.title}**\n🗣️ Langue : ${langue}\n🔗 ${article.url}`);
        totalArticles++;
      }
    }

    if (totalArticles === 0) {
      await channel.send("😴 Aucune actualité récente trouvée pour les sociétés surveillées.");
    }

  } catch (err) {
    console.error("❌ Erreur dans la récupération des news :", err);
  }
}

// 💬 Commande texte : !clear 10
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith('!clear')) {
    // Vérifie la permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("🚫 Tu n'as pas la permission de faire ça.");
    }

    const args = message.content.split(' ');
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('❗ Entre un nombre entre 1 et 100.');
    }

    try {
      await message.channel.bulkDelete(amount, true);
      message.channel.send(`🧹 ${amount} messages supprimés !`).then(msg => {
        setTimeout(() => msg.delete(), 3000);
      });
    } catch (err) {
      console.error("❌ Erreur lors de la suppression :", err);
      message.reply("❌ Impossible de supprimer les messages.");
    }
  }
});

client.login(process.env.TOKEN);
