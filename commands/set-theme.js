export default {
  name: 'set-theme',
  description: 'Set or clear the theme for the current Art Fight event (mod-only). Usage: !set-theme <optional theme name>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const themeName = args.join(' ');
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    db.data.settings = db.data.settings || {};

    if (themeName) {
      db.data.settings.theme = themeName;
      await db.write();
      message.channel.send(`🎨 Theme set to: **${themeName}**`);
    } else {
      delete db.data.settings.theme;
      await db.write();
      message.channel.send(`🗑️ Theme has been cleared.`);
    }
  }
};

