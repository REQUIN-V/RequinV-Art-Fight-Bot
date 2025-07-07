import { getDB } from '../utils/db.js';

export default {
  name: 'edit-banner',
  description: 'Edit the existing scoreboard banner (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const newUrl = args[0];
    if (!newUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(newUrl)) {
      return message.reply('⚠️ Please provide a valid image URL.');
    }

    const db = getDB();
    await db.read();

    if (!db.data.settings?.sharedScoreboardBanner) {
      return message.reply('⚠️ No banner is currently set. Use `!set-banner` instead.');
    }

    db.data.settings.sharedScoreboardBanner = newUrl;
    await db.write();

    return message.reply(`✅ Scoreboard banner updated to:\n${newUrl}`);
  }
};
