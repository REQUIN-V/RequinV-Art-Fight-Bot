import { getDB } from '../utils/db.js';

export default {
  name: 'set-log-channel',
  description: 'Set the current channel as the log channel for attacks and defends (mod-only).',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const channel = message.channel;
    const guildId = message.guild.id;

    if (!channel.isTextBased?.()) {
      return message.reply('❌ This channel is not a text-based channel.');
    }

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

    // Set log channel ID
    db.data.servers[guildId].settings.logChannel = channel.id;
    await db.write();

    return message.channel.send({
      embeds: [{
        title: '✅ Log Channel Set',
        description: `All future attack/defend mod logs will now appear in this channel.`,
        color: 0xff9ecb
      }]
    });
  }
};
