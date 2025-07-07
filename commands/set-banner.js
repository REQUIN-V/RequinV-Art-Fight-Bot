import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    // Permission check (ManageMessages or Admin)
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    let bannerUrl = args[0];

    // 🔍 Check attachments if no URL given
    if (!bannerUrl && message.attachments.size > 0) {
      const imageAttachment = message.attachments.find(att =>
        /\.(png|jpe?g|gif|webp)$/i.test(att.name)
      );

      if (imageAttachment) {
        bannerUrl = imageAttachment.url;
      }
    }

    // ❌ If still no valid image URL found
    if (!bannerUrl || !/^https?:\/\/.+\.(png|jpe?g|gif|webp)$/i.test(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    // ✅ Save to DB
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
