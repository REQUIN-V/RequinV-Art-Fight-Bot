import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    let bannerUrl = args[0];

    // Image URL validator
    const isImageUrl = url =>
      typeof url === 'string' && /^https?:\/\/.+\.(png|jpe?g|gif|webp)$/i.test(url);

    // Check if user uploaded an image instead
    if (!isImageUrl(bannerUrl)) {
      const attachment = message.attachments.first();
      if (attachment && attachment.contentType?.startsWith('image/')) {
        bannerUrl = attachment.url;
      }
    }

    // Final validation
    if (!isImageUrl(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    // Save to DB
    const db = getDB();
    await db.read();
    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    // Confirmation message
    return message.reply({
      content: '✅ Scoreboard banner successfully updated!',
      embeds: [
        {
          title: '📢 New Scoreboard Banner',
          image: { url: bannerUrl },
          color: 0xff9ecb
        }
      ]
    });
  }
};
