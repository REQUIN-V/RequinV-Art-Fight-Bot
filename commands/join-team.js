export default {
  name: 'join-team',
  description: 'Join a team. Usage: !join-team <TeamName>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const teamName = args.join(' ');

    if (!teamName) {
      return message.reply('Usage: !join-team <TeamName>');
    }

    const user = db.data.users.find(u => u.id === userId);
    if (!user) {
      return message.reply('❌ You must register your character before joining a team.');
    }

    const currentEvent = db.data.settings.currentEvent;
    if (!currentEvent || !db.data.settings.teams || !db.data.settings.teams.includes(teamName)) {
      return message.reply(`❌ Team "${teamName}" is not available. Ask a mod for the valid team names.`);
    }

    user.team = teamName;
    await db.write();

    message.channel.send(`🎉 ${message.author.username} has joined **${teamName}**!`);
  }
};
