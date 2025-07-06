export default {
  name: 'scoreboard',
  description: 'Show live team scores',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const attacks = db.data.attacks || [];
    const users = db.data.users || [];

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
      return message.reply('📉 No scores yet.');
    }

    const sorted = Object.entries(teamScores)
      .sort((a, b) => b[1] - a[1])
      .map(([team, score], index) => `${index + 1}. **${team}** – ${score} points`);

    message.channel.send({
      content: `📊 **Current Scoreboard**\n\n${sorted.join('\n')}`
    });
  }
};
