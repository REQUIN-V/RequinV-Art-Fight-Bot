import { getDB } from '../utils/db.js';
import { calculateTeamScores } from '../utils/scoreUtils.js';
import { generateProgressBar } from '../utils/progressBar.js';

export default {
  name: 'scoreboard',
  description: 'Show live team scores',
  async execute(message) {
    const db = getDB();
    await db.read();

    const users = db.data.users || [];
    const attacks = db.data.attacks || [];
    const defenses = db.data.defenses || [];
    const settings = db.data.settings || {};
    const teams = settings.teams || [];

    const teamScores = calculateTeamScores(users, attacks, defenses);

    if (Object.keys(teamScores).length === 0) {
      return message.reply('📉 No team scores have been recorded yet.');
    }

    const entries = Object.entries(teamScores).sort(([, a], [, b]) => b.total - a.total);

    const scoreboardText = entries.map(([team, data], i) =>
      `**${i + 1}. ${team}** — ${data.total} pts *(🖌️ ${data.attack} / 🛡️ ${data.defend})*`
    ).join('\n');

    let progressBarText = '';
    if (entries.length >= 2) {
      const [teamA, teamB] = entries;
      progressBarText = generateProgressBar(teamA[1].total, teamB[1].total, teamA[0], teamB[0]);
    }

    const embed = {
      title: '📊 Current Team Scoreboard',
      color: 0xff9ecb,
      description: scoreboardText + (progressBarText ? `\n\n${progressBarText}` : ''),
      footer: {
        text: 'Updated live as attacks and defenses are submitted'
      }
    };

    // Add scoreboard banner if one exists
    if (settings.sharedScoreboardBanner) {
      embed.image = { url: settings.sharedScoreboardBanner };
    }

    message.channel.send({ embeds: [embed] });
  }
};

