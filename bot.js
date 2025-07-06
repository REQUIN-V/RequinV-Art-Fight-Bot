import './ping.js';
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const config = {
  token: process.env.DISCORD_TOKEN,
  prefix: '!'
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Resolve current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Only load commands once
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.name, command.default);
}

// Use Events.Ready for best practice
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot is ready as ${client.user.tag}`);
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

// Make sure you're only running ONE bot instance
client.login(config.token);

