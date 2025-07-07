import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Permission check (manage messages or admin)
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const bannerUrl = args[0];
    if (!bannerUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL.');
    }

    const db = getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    return message.reply(`✅ Shared scoreboard banner set to:\n${bannerUrl}`);
  }
};
