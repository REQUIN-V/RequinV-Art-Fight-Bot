import { getDB } from './db.js';
import { calculateTeamScores } from './scoreUtils.js';
import { generateProgressBar } from './progressBar.js';

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
const EVENT_DURATION = 30 * MS_IN_A_DAY;

export async function startMonthlyTimer(client) {
  const db = getDB();
  await db.read();

  // 🕒 Initialize event start & end time if not set
  if (!db.data.settings) db.data.settings = {};
  if (!db.data.settings.eventStartTime) {
    const now = Date.now();
    db.data.settings.eventStartTime = now;
    db.data.settings.eventEndTime = now + EVENT_DURATION;
    await db.write();
    console.log('📅 Initialized event start and end times.');
  }

  const tick = async () => {
    await db.read();

    const now = Date.now();
    const endTime = db.data.settings.eventEndTime || 0;

    if (!db.data.settings.eventActive) {
      console.log('⏸️ Event not active. Skipping timer tick.');
      return;
    }

    if (now >= endTime) {
      const users = db.data.users || [];
      const attacks = db.data.attacks || [];
      const defenses = db.data.defenses || [];

      const teamScores = calculateTeamScores(users, attacks, defenses);
      const logChannelId = db.data.settings?.logChannel;

      // 🏁 Format score breakdown
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

      // 📣 Announce in log channel
      if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          await logChannel.send(announcement);
        }
      }

      // 🧹 Reset all data for the next event
      db.data.users = [];
      db.data.attacks = [];
      db.data.defenses = [];
      db.data.settings.bannedUsers = [];
      db.data.settings.eventActive = false;
      db.data.settings.eventStartTime = null;
      db.data.settings.eventEndTime = null;

      await db.write();
      console.log('✅ Monthly event reset complete. All scores cleared and bans lifted.');
    } else {
      // 🕓 Schedule next check
      const remainingMs = endTime - now;
      const nextCheck = Math.min(MS_IN_A_DAY, remainingMs);

      console.log(`⏰ Next timer check in ${(nextCheck / (60 * 60 * 1000)).toFixed(1)} hours`);
      setTimeout(tick, nextCheck);
    }
  };

  // 🟢 Start the first check immediately
  tick();
}
