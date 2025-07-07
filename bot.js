import './ping.js';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { startMonthlyTimer } from './utils/timer.js';
import { connectToDatabase } from './utils/database.js'; // ✅ Your MongoDB connection file

// Load .env variables
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Resolve directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all command files
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
  startMonthlyTimer(client); // ✅ Starts monthly check for all guilds
});

// Command handler
client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client, message.guild.id);
  } catch (error) {
    console.error(`❌ Error executing ${commandName}:`, error);
    if (!message.replied && !message.deferred) {
      message.reply('❌ There was an error executing that command.');
    }
  }
});

// ✅ Connect to MongoDB and then login the bot
connectToDatabase()
  .then(() => {
    console.log('✅ MongoDB connected!');
    return client.login(process.env.DISCORD_TOKEN);
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
