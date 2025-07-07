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

    // Initialize server-specific settings
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

    const isImageUrl = url =>
      typeof url === 'string' &&
      /^https?:\/\/.+/i.test(url) &&
      /\.(png|jpe?g|gif|webp|bmp|svg)?(\?.*)?$/i.test(url);

    const attachment = message.attachments.first();
    if ((!isImageUrl(bannerUrl) || !bannerUrl) && attachment) {
      const type = attachment.contentType || '';
      if (type.startsWith('image/')) {
        bannerUrl = attachment.url;
      }
    }

    if (!bannerUrl) {
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
