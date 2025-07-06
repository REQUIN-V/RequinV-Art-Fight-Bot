export default {
  name: 'set-theme',
  description: 'Set the theme name for the current Art Fight event (mod-only). Usage: !set-theme <theme name>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const themeName = args.join(' ');

    if (!themeName) {
      return message.reply('Usage: !set-theme <theme name>');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.theme = themeName;

    await db.write();

    message.channel.send(`🎨 Theme set to: **${themeName}**`);
  }
};
