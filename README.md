# 📈 Bot Discord Boursier

Un bot Discord pour recevoir automatiquement les dernières news boursières, réagir aux requêtes utilisateurs et envoyer des messages programmés.

---

## 🎯 Objectifs

- Publier automatiquement des news via l'API [Marketaux](https://www.marketaux.com/).
- Réagir à des messages utilisateurs pour chercher des news personnalisées.
- Envoyer des messages de bienvenue et de clôture aux horaires définis.
- Nettoyer les salons via une commande personnalisée `!clear`.

---

## 🧱 Stack technique

- **Node.js**
- **Discord.js**
- **Axios** – pour interroger l'API
- **dotenv** – pour gérer les clés/API
- **node-cron** – pour planifier les tâches

---

## ⚙️ Fonctionnalités

### 🔁 Tâches planifiées

| Heure  | Action                                                            |
|--------|-------------------------------------------------------------------|
| 10:00  | Message de bienvenue + news boursières                           |
| 14:00  | News boursières uniquement                                       |
| 18:00  | News boursières + message de clôture                             |
| Lancement | Envoie aussi les news et un message d'accueil automatiquement |

### 🧠 Réaction aux messages utilisateurs

Tape un mot-clé dans le salon (ex : `Visa Inc`) → le bot cherche et renvoie les dernières actualités correspondantes.

### 💬 Commandes disponibles

- `!clear [nombre]` → supprime le nombre de messages spécifié (défaut = 10).
> ⚠️ Nécessite la permission `Gérer les messages`.

---

## 📄 Structure du projet

```bash
BotDiscord/
├── index.js           # Code principal
├── .env               # Clés API et ID du salon Discord
├── package.json       # Dépendances
└── README.md          # Ce fichier
