import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Check permission
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    let bannerUrl = args[0];

    // Check for direct image URL
    const isImageUrl = url =>
      typeof url === 'string' && /^https?:\/\/.+\.(png|jpe?g|gif|webp)$/i.test(url);

    // If no valid URL provided, check attachment
    if (!isImageUrl(bannerUrl) && message.attachments.size > 0) {
      const attachment = [...message.attachments.values()].find(att => {
        const type = att.contentType || '';
        return type.startsWith('image/');
      });

      if (attachment) bannerUrl = attachment.url;
    }

    // Final check
    if (!isImageUrl(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    // Save to DB
    const db = getDB();
    await db.read();
    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    return message.reply({
      content: '✅ Scoreboard banner successfully updated!',
      embeds: [{
        title: '📢 New Scoreboard Banner',
        image: { url: bannerUrl },
        color: 0xff9ecb
      }]
    });
  }
};
