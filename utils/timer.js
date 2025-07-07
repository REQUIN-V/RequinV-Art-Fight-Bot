import { getDB } from './db.js';
import { calculateTeamScores } from './scoreUtils.js';
import { generateProgressBar } from './progressBar.js';

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
const EVENT_DURATION = 30 * MS_IN_A_DAY;

export async function startMonthlyTimer(client) {
  const db = getDB();
  await db.read();

  // Ensure all guilds have valid structure
  db.data.servers ||= {};
  for (const guildId of Object.keys(db.data.servers)) {
    const server = db.data.servers[guildId];
    server.settings ||= {};
    if (!server.settings.eventStartTime && server.settings.eventActive) {
      const now = Date.now();
      server.settings.eventStartTime = now;
      server.settings.eventEndTime = now + EVENT_DURATION;
      console.log(`📅 Initialized event time for guild ${guildId}`);
    }
  }
  await db.write();

  const tick = async () => {
    await db.read();
    const now = Date.now();

    for (const [guildId, server] of Object.entries(db.data.servers || {})) {
      const { settings } = server;
      if (!settings?.eventActive || !settings?.eventEndTime) continue;

      if (now >= settings.eventEndTime) {
        const teamScores = calculateTeamScores(server);
        const logChannelId = settings.logChannel;

        // Format score summary
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

        // Announce in log channel
        if (logChannelId) {
          try {
            const logChannel = await client.channels.fetch(logChannelId);
            if (logChannel?.isTextBased()) {
              await logChannel.send(announcement);
            }
          } catch (err) {
            console.warn(`⚠️ Could not send to log channel in guild ${guildId}`);
          }
        }

        // Reset server data except settings
        server.users = [];
        server.attacks = [];
        server.defends = [];
        server.settings.bannedUsers = [];
        server.settings.eventActive = false;
        server.settings.eventStartTime = null;
        server.settings.eventEndTime = null;

        console.log(`✅ Reset complete for guild ${guildId}`);
      }
    }

    await db.write();
    console.log('🔁 Timer tick complete, scheduling next check...');

    setTimeout(tick, MS_IN_A_DAY);
  };

  // ⏱️ Start first check immediately
  tick();
}
