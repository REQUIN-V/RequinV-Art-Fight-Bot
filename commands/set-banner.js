import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    let bannerUrl = args[0];

    // Check for attachment if no URL provided
    if (!bannerUrl && message.attachments.size > 0) {
      const imageAttachment = message.attachments.find(att =>
        att.contentType?.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name)
      );
      if (imageAttachment) {
        bannerUrl = imageAttachment.url;
      }
    }

    if (!bannerUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    const db = getDB();
    await db.read();

    db.data.settings = db.data.settings || {};
    db.data.settings.sharedScoreboardBanner = bannerUrl;
    await db.write();

    return message.reply({
      content: '✅ Shared scoreboard banner has been set!',
      embeds: [{
        title: '📢 New Scoreboard Banner',
        image: { url: bannerUrl },
        color: 0xff9ecb
      }]
    });
  }
};
