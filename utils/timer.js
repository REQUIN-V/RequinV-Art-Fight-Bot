import { getDB } from './db.js';
import { calculateTeamScores } from './scoreUtils.js';
import { generateProgressBar } from './progressBar.js';

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
const EVENT_DURATION = 30 * MS_IN_A_DAY; // 30 days in milliseconds

export async function startMonthlyTimer(client) {
  const db = getDB();
  await db.read();

  // Initialize event start time if not set
  if (!db.data.settings) db.data.settings = {};
  if (!db.data.settings.eventStartTime) {
    const now = Date.now();
    db.data.settings.eventStartTime = now;
    db.data.settings.eventEndTime = now + EVENT_DURATION;
    await db.write();
    console.log('📅 Initialized event start and end times.');
  }

  const tick = async () => {
    const now = Date.now();
    await db.read();

    const endTime = db.data.settings.eventEndTime || 0;
    if (now >= endTime) {
      const users = db.data.users || [];
      const attacks = db.data.attacks || [];
      const defenses = db.data.defenses || [];

      const teamScores = calculateTeamScores(users, attacks, defenses);
      const logChannelId = db.data.settings?.logChannel;

      // Format winner announcement
      const entries = Object.entries(teamScores).sort(([, a], [, b]) => b.total - a.total);
      const totalPoints = entries.reduce((sum, [, data]) => sum + data.total, 0);

      let announcement = '🎉 **Art Fight Event Has Ended!**\n\n';
      for (const [team, data] of entries) {
        const percent = totalPoints ? (data.total / totalPoints) * 100 : 0;
        const bar = generateProgressBar(percent);
        announcement += `🏳️ **${team}** — ${data.total} pts\n${bar} \`${percent.toFixed(1)}%\`\n\n`;
      }

      const winner = entries[0]?.[0];
      if (winner) {
        announcement += `🏆 **Winner:** **${winner}** with ${teamScores[winner].total} points!\n`;
      }

      // Post to log channel
      if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          await logChannel.send(announcement);
        }
      }

      // Reset everything except settings
      db.data.users = [];
      db.data.attacks = [];
      db.data.defenses = [];

      db.data.settings.bannedUsers = [];
      db.data.settings.eventActive = false;
      db.data.settings.eventStartTime = null;
      db.data.settings.eventEndTime = null;

      await db.write();
      console.log('✅ Monthly event reset complete. All scores cleared and bans lifted.');
    }

    // Check again in 24 hours
    setTimeout(tick, MS_IN_A_DAY);
  };

  // Start ticking
  setTimeout(tick, MS_IN_A_DAY);
}
