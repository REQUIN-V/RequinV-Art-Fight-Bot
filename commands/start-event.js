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

    const guildId = message.guild.id;

    const db = (await import('../utils/db.js')).getDB();
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

    const server = db.data.servers[guildId];

    if (server.settings.eventActive) {
      return message.reply('⚠️ The event is already active in this server.');
    }

    const now = Date.now();
    const end = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    server.settings.eventActive = true;
    server.settings.eventStartTime = now;
    server.settings.eventEndTime = end;
    server.settings.allow18 = true;
    server.settings.bannedUsers = server.settings.bannedUsers || [];

    await db.write();

    // Start the auto-reset timer if needed (optional for global monitoring)
    startMonthlyTimer(client);

    return message.channel.send(
      `🎉 The Art Fight event has officially started on this server!\n` +
      `🕒 It will end <t:${Math.floor(end / 1000)}:R> (on <t:${Math.floor(end / 1000)}:f>).`
    );
  }
};

