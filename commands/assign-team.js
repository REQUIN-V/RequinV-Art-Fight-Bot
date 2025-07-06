export default {
  name: 'assign-team',
  description: 'Assign a user to a team (mod-only). Usage: !assign-team @user TeamName',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const mention = message.mentions.users.first();
    const team = args.slice(1).join(' ');

    if (!mention || !team) {
      return message.reply('Usage: !assign-team @user TeamName');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userData = db.data.users.find(user => user.id === mention.id);
    if (!userData) {
      return message.reply('❌ That user has not registered a character yet.');
    }

    userData.team = team;
    await db.write();

    message.channel.send(`✅ ${mention.username} has been assigned to **${team}**.`);
  }
};
