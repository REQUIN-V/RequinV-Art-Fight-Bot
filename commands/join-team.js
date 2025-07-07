export default {
  name: 'join-team',
  description: 'Join a team. Usage: !join-team <TeamName>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    const userId = message.author.id;
    const teamName = args.join(' ').trim();

    if (!teamName) {
      return message.reply('❌ Usage: !join-team <TeamName>');
    }

    // Ensure the server-specific structure exists
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      teams: {},
      settings: {}
    };

    const server = db.data.servers[guildId];
    const user = server.users.find(u => u.id === userId);
    const teams = server.teams || {};
    const validTeams = Object.values(teams);

    if (!user) {
      return message.reply('❌ You must register your character before joining a team.');
    }

    if (!validTeams.includes(teamName)) {
      return message.reply(
        `❌ Team "${teamName}" is not available.\nValid teams: ${validTeams.join(' or ')}`
      );
    }

    if (user.team) {
      return message.reply(`🚫 You’ve already joined **${user.team}**. Team changes are locked for this event.`);
    }

    user.team = teamName;
    await db.write();

    message.channel.send(`🎉 ${message.author.username} has joined **${teamName}**!`);
  }
};
