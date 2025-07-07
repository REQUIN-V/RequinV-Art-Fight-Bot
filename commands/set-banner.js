import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has('ManageMessages') && !message.member.permissions.has('Administrator')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // Use either URL argument or attached image
    const bannerUrl =
      args[0] && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(args[0])
        ? args[0]
        : message.attachments.first()?.url;

    if (!bannerUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    const db = getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    return message.reply(`✅ Shared scoreboard banner updated:\n${bannerUrl}`);
  }
};
