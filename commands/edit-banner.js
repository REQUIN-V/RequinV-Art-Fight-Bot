import { getDB } from '../utils/db.js';

export default {
  name: 'edit-banner',
  description: 'Edit the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // Allow either URL or uploaded image
    let newBannerUrl = args[0];

    if (!newBannerUrl && message.attachments.size > 0) {
      const image = message.attachments.find(att => att.contentType?.startsWith('image/'));
      if (image) newBannerUrl = image.url;
    }

    if (!newBannerUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(newBannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    const db = getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = newBannerUrl;
    await db.write();

    return message.reply(`✅ Banner image successfully updated:\n${newBannerUrl}`);
  }
};
