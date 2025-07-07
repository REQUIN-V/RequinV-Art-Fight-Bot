import { getDB } from '../utils/db.js';

export default {
  name: 'set-log-channel',
  description: 'Set the current channel as the log channel for attacks (mod-only).',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const guildId = message.guild.id;

    const db = getDB();
    await db.read();

    // Ensure server structure exists
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: []
    };

    // Set log channel for this server
    db.data.servers[guildId].settings.logChannel = message.channel.id;
    await db.write();

    message.channel.send(`📌 This channel has been set as the **attack log channel** for this server.`);
  }
};
