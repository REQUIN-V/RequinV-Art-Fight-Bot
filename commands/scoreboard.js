import { getDB } from '../utils/db.js';

export default {
  name: 'scoreboard',
  description: 'Show live team scores',
  async execute(message) {
    const db = getDB();
    await db.read();

    const guildId = message.guild.id;

    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: {}
    };

    const server = db.data.servers[guildId];
    const { attacks = [], defends = [], users = [], settings = {} } = server;

    const teamA = settings.teams?.teamA || 'Team A';
    const teamB = settings.teams?.teamB || 'Team B';

    const teamScores = {
      [teamA]: 0,
      [teamB]: 0
    };

    for (const user of users) {
      if (!user.team || !teamScores.hasOwnProperty(user.team)) continue;

      const attackPoints = attacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
      const defendPoints = defends.filter(d => d.from === user.id).reduce((sum, d) => sum + d.points, 0);

      teamScores[user.team] += attackPoints + defendPoints;
    }

    const scoreA = teamScores[teamA] || 0;
    const scoreB = teamScores[teamB] || 0;
    const total = scoreA + scoreB;

    const percentA = total === 0 ? 50 : (scoreA / total) * 100;
    const percentB = 100 - percentA;

    const totalBars = 20;
    const barsA = Math.round((percentA / 100) * totalBars);
    const barsB = totalBars - barsA;

    const whiteBlock = '⬜'; // Team A
    const pinkBlock = '🩷'; // Team B
    const bar = whiteBlock.repeat(barsA) + pinkBlock.repeat(barsB);

    const embed = {
      title: '📊 Live Team Scoreboard',
      color: 0xff9ecb,
      description:
        `🏳️ **${teamA}** — ${scoreA} pts\n` +
        `🏳️ **${teamB}** — ${scoreB} pts\n\n` +
        bar + `\n\n` +
        `⬜ ${teamA} — ${percentA.toFixed(1)}%\n` +
        `🩷 ${teamB} — ${percentB.toFixed(1)}%`,
      footer: { text: 'Updated live as attacks/defenses are submitted.' }
    };

    if (settings.sharedScoreboardBanner) {
      embed.image = { url: settings.sharedScoreboardBanner };
    }

    message.channel.send({ embeds: [embed] });
  }
};

