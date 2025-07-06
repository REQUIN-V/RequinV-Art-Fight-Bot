export default {
  name: 'set-event-teams',
  description: 'Set team names for the current event (mod-only). Usage: !set-event-teams TeamA TeamB',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    if (args.length < 2) {
      return message.reply('Usage: !set-event-teams TeamA TeamB');
    }

    const teamA = args[0];
    const teamB = args[1];

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.teams = [teamA, teamB];
    db.data.settings.currentEvent = `${teamA} vs ${teamB}`;

    await db.write();

    message.channel.send(`✅ Current event teams set to: **${teamA}** and **${teamB}**!`);
  }
};
