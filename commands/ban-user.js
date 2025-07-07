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

    const now = new Date().toISOString();

    db.data.settings = db.data.settings || {};
    db.data.settings.bannedUsers = db.data.settings.bannedUsers || [];

    const alreadyBanned = db.data.settings.bannedUsers.find(user => user.id === mention.id);
    if (alreadyBanned) {
      return message.reply('🚫 That user is already banned from the event.');
    }

    db.data.settings.bannedUsers.push({ id: mention.id, bannedAt: now });
    await db.write();

    return message.reply(`✅ <@${mention.id}> has been banned from participating in this event.`);
  }
};
