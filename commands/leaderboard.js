export default {
  name: 'leaderboard',
  description: 'Show current team scores',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const attacks = db.data.attacks || [];
    const users = db.data.users || [];
    const settings = db.data.settings || {};
    const teams = settings.teams || [];

    const teamScores = {};

    for (const attack of attacks) {
      const attacker = users.find(u => u.id === attack.from);
      if (!attacker || !attacker.team) continue;

      if (!teamScores[attacker.team]) {
        teamScores[attacker.team] = 0;
      }

      teamScores[attacker.team] += attack.points;
    }

    if (Object.keys(teamScores).length === 0) {
      return message.reply('📉 No team scores yet.');
    }

    const sorted = Object.entries(teamScores)
      .sort((a, b) => b[1] - a[1])
      .map(([team, score], index) => `**${index + 1}. ${team}** — ${score} pts`);

    const embed = {
      title: '🏆 Team Leaderboard',
      color: 0xff9ecb,
      description: sorted.join('\n'),
      footer: {
        text: 'Based on total attack points from all team members.'
      }
    };

    message.channel.send({ embeds: [embed] });
  }
};

