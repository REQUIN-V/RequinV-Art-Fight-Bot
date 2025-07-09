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

    // ✅ Properly handle array-based team storage
    const definedTeams = Array.isArray(settings.teams) ? settings.teams.map(t => t.trim()) : [];

    if (definedTeams.length !== 2) {
      return message.reply('⚠️ No teams have been defined yet. Use `!set-event-teams <TeamA> <TeamB>` first.');
    }

    const teamScores = Object.fromEntries(definedTeams.map(team => [team, 0]));

    for (const user of users) {
      const { team } = user;
      if (!team || !definedTeams.includes(team)) continue;

      const attackPoints = attacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
      const defendPoints = defends.filter(d => d.from === user.id).reduce((sum, d) => sum + d.points, 0);
      teamScores[team] += attackPoints + defendPoints;
    }

    const totalPoints = Object.values(teamScores).reduce((a, b) => a + b, 0) || 1;
    const totalBars = 20;
    const barColors = ['⬜', '🩷'];

    const bar = Object.entries(teamScores)
      .map(([team, score], i) => {
        const percent = (score / totalPoints) * 100;
        const bars = Math.round((percent / 100) * totalBars);
        return `${barColors[i % barColors.length].repeat(bars)} ${team} — ${score} pts (${percent.toFixed(1)}%)`;
      })
      .join('\n');

    const embed = {
      title: '📊 Live Team Scoreboard',
      color: 0xff9ecb,
      description: bar,
      footer: { text: 'Updated live as attacks/defenses are submitted.' }
    };

    if (settings.sharedScoreboardBanner) {
      embed.image = { url: settings.sharedScoreboardBanner };
    }

    return message.channel.send({ embeds: [embed] });
  }
};
