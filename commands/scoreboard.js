export default {
  name: 'scoreboard',
  description: 'Show live team scores',
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
      return message.reply('📉 No team scores have been recorded yet.');
    }

    const sorted = Object.entries(teamScores)
      .sort((a, b) => b[1] - a[1])
      .map(([team, score], index) => `**${index + 1}. ${team}** – ${score} pts`);

    const embed = {
      title: '📊 Current Team Scoreboard',
      color: 0xff9ecb,
      description: sorted.join('\n'),
      footer: {
        text: 'Updated live as attacks are submitted'
      }
    };

    message.channel.send({ embeds: [embed] });
  }
};
