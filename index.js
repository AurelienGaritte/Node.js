const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ✅ Mots-clés personnalisés
const motsCles = `"Orange SA" OR ORA OR 
"Consol Energy" OR CEIX OR 
"Mo-Bruk SA" OR MBR.WA OR 
"Nak Sealing Technologies Corp" OR 9942.TW OR 
"Mastercard Inc" OR MA OR 
"Visa Inc" OR V OR 
"ASML Holding NV" OR ASML OR 
"S&P 500" OR "S&P500" OR SP500 OR SPY OR 
"USDA" OR 
"Rana Gruber" OR RANA.OL OR 
"XETRA-GOLD" OR "4GLD" OR 
"TSMC" OR 
"Zengame Technology" OR 
"Hemisphere Energy" OR HME OR 
"Interactive Brokers" OR IBKR`;

// 🧠 Mémoire des sujets du jour
let sujetsDuJour = new Set();

client.once('ready', () => {
  console.log(`📈 Bot boursier connecté en tant que ${client.user.tag}`);

  // 🔁 Envoi immédiat au lancement
  postMarketNews();

  // ⏰ Envoi aux heures fixes : 10h, 14h, 18h
  cron.schedule('0 10,14,18 * * *', () => {
    console.log("🕒 Déclenchement d'une recherche de news");
    postMarketNews();
  });

  // 📅 Récap à 18h02
  cron.schedule('2 18 * * *', () => {
    sendDailyRecap();
  });
});

async function postMarketNews() {
  try {
    const query = encodeURIComponent(motsCles);
    const url = `https://api.marketaux.com/v1/news/all?language=fr,en&api_token=${process.env.MARKETAUX_KEY}&q=${query}`;
    const res = await axios.get(url);
    const articles = res.data.data.slice(0, 5);

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    if (articles.length === 0) {
      await channel.send("😴 Aucune actualité trouvée via Marketaux.");
      return;
    }

    for (const article of articles) {
      const lang = article.language === 'fr' ? '🇫🇷 Français' : '🇬🇧 Anglais';
      const title = article.title || '[Sans titre]';
      const summary = article.description || '';
      const topic = article.entities?.[0]?.name || 'un sujet suivi';
      const source = article.source || 'source inconnue';

      // Ajout à la mémoire du jour
      if (topic) sujetsDuJour.add(topic);

      await channel.send(`🧠 Nouvelle news sur **${topic}** !\n🗣️ Langue : ${lang}\n**${title}**\n${summary}\n🔗 ${article.url}`);
    }

  } catch (err) {
    console.error("❌ Erreur Marketaux :", err.message || err);
  }
}

async function sendDailyRecap() {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  if (sujetsDuJour.size === 0) {
    await channel.send("📅 Aucun sujet mentionné aujourd’hui. Journée calme 💤");
  } else {
    const sujets = Array.from(sujetsDuJour).join(', ');
    await channel.send(`📊 **Récap des sujets abordés aujourd’hui :**\n🧠 ${sujets}`);
  }

  // Réinitialiser la mémoire
  sujetsDuJour.clear();
}

// 🧽 Commande !clear <nombre>
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith('!clear')) {
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
