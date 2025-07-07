import { getDB } from './db.js';
import { calculateTeamScores } from './scoreUtils.js';
import { generateProgressBar } from './progressBar.js';

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_MONTH = 30;

/**
 * Starts the monthly timer and performs event reset + announcement after 30 days.
 */
export function startMonthlyTimer(client) {
  let daysPassed = 0;

  const tick = async () => {
    daysPassed++;

    if (daysPassed >= DAYS_IN_MONTH) {
      const db = getDB();
      await db.read();

      const users = db.data.users || [];
      const attacks = db.data.attacks || [];
      const defenses = db.data.defenses || [];

      const teamScores = calculateTeamScores(users, attacks, defenses);
      const logChannelId = db.data.settings?.logChannel;

      // Format announcement
      const entries = Object.entries(teamScores).sort(([, a], [, b]) => b.total - a.total);
      const totalPoints = entries.reduce((sum, [, data]) => sum + data.total, 0);

      let announcement = '🎉 **Art Fight Event Has Ended!**\n\n';
      for (const [team, data] of entries) {
        const percentage = totalPoints ? (data.total / totalPoints) * 100 : 0;
        const bar = generateProgressBar(percentage);
        announcement += `🏳️ **${team}** — ${data.total} pts\n${bar} \`${percentage.toFixed(1)}%\`\n\n`;
      }

      const winner = entries[0]?.[0];
      if (winner) {
        announcement += `🏆 **Winner:** **${winner}** with ${teamScores[winner].total} points!\n`;
      }

      // Send to log channel if set
      if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          logChannel.send(announcement);
        }
      }

      // Reset all stored data (except settings)
      db.data.users = [];
      db.data.attacks = [];
      db.data.defenses = [];
      await db.write();

      console.log('✅ Monthly event reset complete.');
      daysPassed = 0; // restart month
    }

    // Wait another day and tick again
    setTimeout(tick, MS_IN_A_DAY);
  };

  // Start ticking
  setTimeout(tick, MS_IN_A_DAY);
}
