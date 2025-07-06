export default {
  name: 'set-log-channel',
  description: 'Set the current channel as the log channel for attacks (mod-only).',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.logChannel = message.channel.id;

    await db.write();

    message.channel.send(`📌 This channel has been set as the **attack log channel**.`);
  }
};
