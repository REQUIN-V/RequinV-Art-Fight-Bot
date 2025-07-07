import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set or update the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    let bannerUrl = args[0];

    // Helper to validate image URLs
    const isImageUrl = url =>
      typeof url === 'string' && /^https?:\/\/.+\.(png|jpe?g|gif|webp)$/i.test(url);

    // If invalid or no URL, check for attachments
    if (!isImageUrl(bannerUrl) && message.attachments.size > 0) {
      const imageAttachment = message.attachments.find(att => {
        const fileType = att.contentType || '';
        return fileType.startsWith('image/');
      });

      if (imageAttachment) bannerUrl = imageAttachment.url;
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

    // Confirmation embed
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
