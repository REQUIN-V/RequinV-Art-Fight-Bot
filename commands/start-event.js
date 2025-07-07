import { PermissionsBitField } from 'discord.js';

export default {
  name: 'start-event',
  description: 'Starts the 30-day art fight event. [Mod-only]',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    // 🛡️ Check if user has MANAGE_GUILD permissions (mod-only)
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('🚫 Only moderators can start the event.');
    }

    // ✅ Prevent multiple starts
    if (db.data.settings?.eventActive) {
      return message.reply('⚠️ The event is already active.');
    }

    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const end = now + thirtyDaysInMs;

    // 🔄 Set event data
    db.data.settings = db.data.settings || {};
    db.data.settings.eventActive = true;
    db.data.settings.eventStartTime = now;
    db.data.settings.eventEndTime = end;
    db.data.settings.allow18 = true; // Optional: default to enabled unless disabled later
    db.data.settings.bannedUsers = db.data.settings.bannedUsers || [];

    await db.write();

    // 📢 Confirmation message
    return message.channel.send(
      `🎉 The art fight event has officially started!\n` +
      `🕒 It will end <t:${Math.floor(end / 1000)}:R> (on <t:${Math.floor(end / 1000)}:f>).`
    );
  }
};
