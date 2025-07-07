import { PermissionsBitField } from 'discord.js';
import { startMonthlyTimer } from '../utils/timer.js';

export default {
  name: 'start-event',
  description: 'Starts the 30-day art fight event. [Mod-only]',
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('🚫 Only moderators can start the event.');
    }

    if (!client) {
      return message.reply('❌ Internal error: client not found.');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    // Prevent multiple starts
    db.data.settings = db.data.settings || {};
    if (db.data.settings.eventActive) {
      return message.reply('⚠️ The event is already active.');
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const end = now + thirtyDays;

    db.data.settings.eventActive = true;
    db.data.settings.eventStartTime = now;
    db.data.settings.eventEndTime = end;
    db.data.settings.allow18 = true;
    db.data.settings.bannedUsers = db.data.settings.bannedUsers || [];

    await db.write();

    // Start the auto-reset timer
    startMonthlyTimer(client);

    return message.channel.send(
      `🎉 The art fight event has officially started!\n` +
      `🕒 It will end <t:${Math.floor(end / 1000)}:R> (on <t:${Math.floor(end / 1000)}:f>).`
    );
  }
};

