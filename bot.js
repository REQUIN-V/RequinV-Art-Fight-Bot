import './ping.js';

import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMonthlyTimer } from './utils/timer.js';

// Load config.json if exists (used for Gist backup)
let GIST_ID = null;
let GITHUB_TOKEN = null;

try {
  const configPath = path.resolve(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    const localConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    GIST_ID = localConfig.GIST_ID;
    GITHUB_TOKEN = localConfig.GITHUB_TOKEN;
    console.log('🧪 Loaded local config.json for Gist backup.');
  }
} catch (err) {
  console.warn('⚠️ Failed to load config.json:', err);
}

export const GIST_CONFIG = { GIST_ID, GITHUB_TOKEN };

const config = {
  token: process.env.DISCORD_TOKEN,
  prefix: '!'
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command?.default?.name) {
    console.warn(`⚠️ Skipped loading ${file} (no command name)`);
    continue;
  }
  client.commands.set(command.default.name, command.default);
}

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
  startMonthlyTimer(client); // ⏳ Start the monthly timer
});

client.on(Events.MessageCreate, async message => {
  if (!message.content.startsWith(config.prefix) || message.author.bot || !message.guild) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client, message.guild.id);
  } catch (error) {
    console.error(`❌ Error running ${commandName}:`, error);
    if (!message.replied && !message.deferred) {
      message.reply('❌ There was an error executing that command.');
    }
  }
});

// 🧹 Log moderation button handler (delete log embed)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, type, id] = interaction.customId.split(':');

  if (action === 'deleteLog' && (type === 'attack' || type === 'defend')) {
    if (!interaction.memberPermissions.has('ManageMessages')) {
      return interaction.reply({ content: '❌ You do not have permission to delete this.', ephemeral: true });
    }

    try {
      await interaction.message.delete();
      await interaction.reply({ content: `🗑️ ${type === 'attack' ? 'Attack' : 'Defense'} log deleted.`, ephemeral: true });
    } catch (err) {
      console.error('❌ Failed to delete log message:', err);
      await interaction.reply({ content: '⚠️ Failed to delete log message.', ephemeral: true });
    }
  }
});

client.login(config.token);
