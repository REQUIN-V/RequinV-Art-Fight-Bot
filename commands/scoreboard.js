import { getDB } from '../utils/db.js';

export default {
  name: 'scoreboard',
  description: 'Show live team scores',
  async execute(message) {
    const db = getDB();
    await db.read();

    const attacks = db.data.attacks || [];
    const defenses = db.data.defenses || [];
    const users = db.data.users || [];
    const settings = db.data.settings || {};
    const teams = settings.teams || [];

    const teamScores = {};

    // Tally attack + defend points per team
    for (const user of users) {
      if (!user.team) continue;
      const team = user.team;

      const attackPoints = attacks
        .filter(a => a.from === user.id)
        .reduce((sum, a) => sum + a.points, 0);

      const defendPoints = defenses
        .filter(d => d.from === user.id)
        .reduce((sum, d) => sum + d.points, 0);

      if (!teamScores[team]) teamScores[team] = 0;
      teamScores[team] += attackPoints + defendPoints;
    }

    const [teamA, teamB] = Object.keys(teamScores);
    const scoreA = teamScores[teamA] || 0;
    const scoreB = teamScores[teamB] || 0;
    const total = scoreA + scoreB;

    // Progress bar generation
    const percentA = total === 0 ? 50 : (scoreA / total) * 100;
    const percentB = 100 - percentA;
    const totalBars = 20;
    const barsA = Math.round((percentA / 100) * totalBars);
    const barsB = totalBars - barsA;
    const bar = '`' + '█'.repeat(barsA) + '▏' + '█'.repeat(barsB) + '`';

    // Embed construction
    const embed = {
      title: '📊 Live Team Scoreboard',
      color: 0xff9ecb,
      description:
        `🏳️ **${teamA || 'Team A'}** — ${scoreA} pts\n` +
        `🏳️ **${teamB || 'Team B'}** — ${scoreB} pts\n\n` +
        bar + `\n\n` +
        `🔴 ${teamA || 'Team A'} — ${percentA.toFixed(1)}%\n` +
        `🔵 ${teamB || 'Team B'} — ${percentB.toFixed(1)}%`,
      footer: { text: 'Updated live as attacks/defenses are submitted.' }
    };

    if (settings.sharedScoreboardBanner) {
      embed.image = { url: settings.sharedScoreboardBanner };
    }

    message.channel.send({ embeds: [embed] });
  }
};
