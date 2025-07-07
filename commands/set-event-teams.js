import { getDB } from '../utils/db.js';

export default {
  name: 'set-event-teams',
  description: 'Set team names for the current event (mod-only). Usage: !set-event-teams TeamA TeamB',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    if (args.length < 2) {
      return message.reply('❌ Usage: !set-event-teams TeamA TeamB');
    }

    const [teamA, teamB] = args;
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
    server.teams = [teamA, teamB];
    server.settings.currentEvent = `${teamA} vs ${teamB}`;

    await db.write();

    message.channel.send(`✅ Current event teams set to: **${teamA}** and **${teamB}**!`);
  }
};
