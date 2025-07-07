// Load environment variables from .env file
import 'dotenv/config';
import './ping.js';

import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMonthlyTimer } from './utils/timer.js';
import { connectToDatabase } from './utils/database.js'; // ✅ MongoDB connection

// Load config from environment
const config = {
  token: process.env.DISCORD_TOKEN,
  prefix: '!'
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Resolve current file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Dynamically import commands
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command?.default?.name) {
    console.warn(`⚠️ Skipped loading ${file} (no command name)`);
    continue;
  }
  client.commands.set(command.default.name, command.default);
}

// When bot is ready
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);

  // 🗄️ Connect to MongoDB
  await connectToDatabase();

  // ⏳ Start the monthly event timer
  startMonthlyTimer(client);
});

// Message command handler
client.on(Events.MessageCreate, async message => {
  if (!message.content.startsWith(config.prefix) || message.author.bot || !message.guild) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    // Pass client and guild ID to command
    await command.execute(message, args, client, message.guild.id);
  } catch (error) {
    console.error(`❌ Error running ${commandName}:`, error);
    if (!message.replied && !message.deferred) {
      message.reply('❌ There was an error executing that command.');
    }
  }
});

// Login the bot
client.login(config.token);
