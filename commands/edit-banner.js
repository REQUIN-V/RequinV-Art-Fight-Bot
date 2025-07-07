import { getDB } from '../utils/db.js';

export default {
  name: 'edit-banner',
  description: 'Edit the existing scoreboard banner (mods only)',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has('ManageMessages') && !message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const newUrl =
      args[0] && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(args[0])
        ? args[0]
        : message.attachments.first()?.url;

    if (!newUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(newUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
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
