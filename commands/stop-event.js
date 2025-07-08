import { getDB } from '../utils/db.js';

export default {
  name: 'stop-event',
  description: 'Stop the current event and wipe all user/attack/defend data, but preserve scores (mod-only).',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const guildId = message.guild.id;
    const db = getDB();
    await db.read();

    db.data.servers = db.data.servers || {};
    const server = db.data.servers[guildId];

    if (!server || !server.settings?.eventActive) {
      return message.reply('⚠️ There is no active event to stop.');
    }

    // Preserve scores by summing team points before wiping
    const allAttacks = server.attacks || [];
    const allDefends = server.defends || [];
    const allUsers = server.users || [];

    const teamScores = {};

    for (const user of allUsers) {
      const team = user.team;
      if (!team) continue;

      const attackPoints = allAttacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
      const defendPoints = allDefends.filter(d => d.from === user.id).reduce((sum, d) => sum + d.points, 0);
      const total = attackPoints + defendPoints;

      teamScores[team] = (teamScores[team] || 0) + total;
    }

    // Wipe user-specific data
    server.users = [];
    server.attacks = [];
    server.defends = [];

    // Store final scores
    server.settings.finalScores = teamScores;
    server.settings.eventActive = false;
    server.settings.eventStartTime = null;
    server.settings.eventEndTime = null;

    await db.write();

    message.channel.send(
      '🛑 The event has been manually stopped.\nAll user data has been wiped, but final scores were preserved for the scoreboard.'
    );
  }
};
