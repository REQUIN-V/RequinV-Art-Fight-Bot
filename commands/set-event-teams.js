import { getDB } from '../utils/db.js';

export default {
  name: 'set-event-teams',
  description: 'Set team names for the current event.',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You don’t have permission to use this command.');
    }

    const [rawTeamA, rawTeamB] = args;
    if (!rawTeamA || !rawTeamB) {
      return message.reply('❌ Usage: `!set-event-teams <teamA> <teamB>`');
    }

    const teamA = rawTeamA.trim();
    const teamB = rawTeamB.trim();

    const db = getDB();
    await db.read();

    const guildId = message.guild.id;
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defends: [],
    };

    // Store the team names as an array for simplicity and consistency
    db.data.servers[guildId].settings.teams = [teamA, teamB];

    await db.write();

    return message.reply(`✅ Set team names: **${teamA}** and **${teamB}**`);
  }
};
