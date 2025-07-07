export default {
  name: 'team-info',
  description: 'Show the current team names and event theme.',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;

    // Ensure server data structure exists
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: {
        teamA: 'Team A',
        teamB: 'Team B'
      }
    };

    const server = db.data.servers[guildId];
    const theme = server.settings?.theme || 'No theme set yet.';
    const teams = server.teams || { teamA: 'Team A', teamB: 'Team B' };

    const embed = {
      title: '🎨 Current Art Fight Event Info',
      color: 0xff9ecb,
      fields: [
        { name: '🧵 Theme', value: theme, inline: false },
        { name: '🟥 Team 1', value: teams.teamA, inline: true },
        { name: '🟦 Team 2', value: teams.teamB, inline: true }
      ],
      footer: { text: 'Use !set-theme or !set-event-teams to update this (mods only)' }
    };

    await message.channel.send({ embeds: [embed] });
  }
};
