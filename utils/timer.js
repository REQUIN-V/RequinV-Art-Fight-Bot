import { getDB } from './db.js';
import { generateProgressBar } from './progressBar.js';
import { calculateTeamScores } from './scoreUtils.js';

export async function startMonthlyTimer(client) {
  const db = getDB();
  await db.read();

  // Calculate time left until 1 month from now
  const startTime = db.data.settings?.eventStart
    ? new Date(db.data.settings.eventStart)
    : new Date();

  // Save the start time if it doesn't exist
  if (!db.data.settings?.eventStart) {
    db.data.settings = db.data.settings || {};
    db.data.settings.eventStart = startTime.toISOString();
    await db.write();
  }

  const oneMonthLater = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000);
  const timeRemaining = oneMonthLater.getTime() - Date.now();

  // Set timer to trigger event end
  setTimeout(async () => {
    await db.read();
    const scores = calculateTeamScores(db.data.users);
    const [teamA, teamB] = Object.keys(scores);
    const pointsA = scores[teamA] || 0;
    const pointsB = scores[teamB] || 0;

    const bar = generateProgressBar(pointsA, pointsB, teamA, teamB);
    const winner =
      pointsA === pointsB
        ? '🤝 It’s a tie!'
        : pointsA > pointsB
        ? `🏆 **${teamA}** wins the event!`
        : `🏆 **${teamB}** wins the event!`;

    const channelId = db.data.settings?.logChannel;
    const guilds = client.guilds.cache;
    const firstGuild = guilds.first();
    const channel = firstGuild?.channels.cache.get(channelId);

    if (channel?.isTextBased()) {
      await channel.send({
        content:
          `🎉 **The event has ended!**\n\n` +
          `${bar}\n\n` +
          `Final Scores:\n- ${teamA}: ${pointsA} pts\n- ${teamB}: ${pointsB} pts\n\n` +
          `${winner}`
      });
    }

    // Reset the database
    db.data.users = [];
    db.data.attacks = [];
    db.data.defenses = [];
    db.data.settings.eventStart = null;
    await db.write();

    console.log('✅ Monthly reset complete: event data cleared.');
  }, timeRemaining);
}
