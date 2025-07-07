import { getDB } from '../utils/db.js';

export default {
  name: 'ban-user',
  description: 'Ban a user from participating in the current event (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const mention = message.mentions.users.first();
    if (!mention) {
      return message.reply('⚠️ Please mention a user to ban from the event.');
    }

    const db = getDB();
    await db.read();

    const guildId = message.guild.id;
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defenses: []
    };

    const serverSettings = db.data.servers[guildId].settings;
    serverSettings.bannedUsers = serverSettings.bannedUsers || [];

    const alreadyBanned = serverSettings.bannedUsers.find(user => user.id === mention.id);
    if (alreadyBanned) {
      return message.reply('🚫 That user is already banned from the event.');
    }

    serverSettings.bannedUsers.push({ id: mention.id, bannedAt: new Date().toISOString() });

    await db.write();

    return message.reply(`✅ <@${mention.id}> has been banned from participating in this server’s event.`);
  }
};
