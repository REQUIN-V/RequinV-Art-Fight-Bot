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

    // Check if the given URL looks like an image link
    const isImageUrl = url =>
      typeof url === 'string' &&
      /^https?:\/\/.+/i.test(url) &&
      /\.(png|jpe?g|gif|webp|bmp|svg)?(\?.*)?$/i.test(url); // allows common image extensions but doesn't require them

    // If the input isn't a valid URL or doesn't point to an image, try the first attachment
    const attachment = message.attachments.first();
    if ((!isImageUrl(bannerUrl) || !bannerUrl) && attachment) {
      const type = attachment.contentType || '';
      if (type.startsWith('image/')) {
        bannerUrl = attachment.url;
      }
    }

    // Final check
    if (!bannerUrl) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    // Save it to the database
    const db = getDB();
    await db.read();
    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    // Respond with confirmation + banner preview
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
