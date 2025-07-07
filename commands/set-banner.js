import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // Get image URL from args or attachment
    let bannerUrl = args[0];

    if (!bannerUrl && message.attachments.size > 0) {
      const image = message.attachments.find(att => att.contentType?.startsWith('image/'));
      if (image) bannerUrl = image.url;
    }

    if (!bannerUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    const db = getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    return message.reply(`✅ Shared scoreboard banner set to:\n${bannerUrl}`);
  }
};
