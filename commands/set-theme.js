import { getDB } from '../utils/db.js';

export default {
  name: 'set-theme',
  description: 'Set or clear the theme for the current Art Fight event (mod-only). Usage: !set-theme <optional theme name>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const themeName = args.join(' ').trim();
    const guildId = message.guild.id;

    const db = getDB();
    await db.read();

    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: []
    };

    const server = db.data.servers[guildId];

    if (themeName) {
      server.settings.theme = themeName;
      await db.write();
      message.channel.send(`🎨 Theme set to: **${themeName}**`);
    } else {
      delete server.settings.theme;
      await db.write();
      message.channel.send(`🗑️ Theme has been cleared.`);
    }
  }
};

