import { getDB } from '../utils/db.js';

export default {
  name: 'set-banner',
  description: 'Set the shared scoreboard banner image (mods only)',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const guildId = message.guild.id;
    const db = getDB();
    await db.read();

    // Initialize server-specific structure
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defends: [],
      teams: {}
    };

    const server = db.data.servers[guildId];

    let bannerUrl = args[0];
    const attachment = message.attachments.first();

    const isImageUrl = (url) =>
      typeof url === 'string' &&
      /^https?:\/\/[^ ]+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

    // Use attachment if URL arg is invalid or missing
    if ((!isImageUrl(bannerUrl) || !bannerUrl) && attachment) {
      const contentType = attachment.contentType || '';
      if (contentType.startsWith('image/')) {
        bannerUrl = attachment.url;
      }
    }

    if (!isImageUrl(bannerUrl)) {
      return message.reply('⚠️ Please provide a valid image URL or upload an image with the command.');
    }

    server.settings.sharedScoreboardBanner = bannerUrl;
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
