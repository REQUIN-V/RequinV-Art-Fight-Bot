export default {
  name: 'team-info',
  description: 'Show the current team names and event theme.',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const theme = db.data.settings?.theme || 'No theme set yet.';
    const teams = db.data.teams || { teamA: 'Team A', teamB: 'Team B' };

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

    message.channel.send({ embeds: [embed] });
  }
};
