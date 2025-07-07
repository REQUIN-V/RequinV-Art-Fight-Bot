import './ping.js';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMonthlyTimer } from './utils/timer.js'; // ✅ Monthly reset timer

const config = {
  token: process.env.DISCORD_TOKEN,
  prefix: '!'
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Resolve directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands safely
for (const file of commandFiles) {
  const filePath = `file://${path.join(commandsPath, file)}`;
  try {
    const command = await import(filePath);
    if (!command?.default?.name) {
      console.warn(`⚠️ Skipped loading command: ${file} (missing name or invalid export)`);
      continue;
    }
    client.commands.set(command.default.name, command.default);
  } catch (err) {
    console.error(`❌ Failed to load command ${file}:`, err.message);
  }
}

// Bot ready
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is ready as ${client.user.tag}`);
  startMonthlyTimer(client); // ✅ Start monthly timer
});

// Handle messages
client.on(Events.MessageCreate, async message => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    if (!message.replied && !message.deferred) {
      message.reply('❌ There was an error executing that command.');
    }
  }
});

client.login(config.token);
