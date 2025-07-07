export default {
  name: 'set-banners',
  description: '👑 [MOD] Set banner image URLs for the current teams. Usage: !set-banners <Team A URL> <Team B URL>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const [bannerA, bannerB] = args;

    if (!bannerA || !bannerB || !/^https?:\/\/.+\.(png|jpg|jpeg|gif)$/i.test(bannerA) || !/^https?:\/\/.+\.(png|jpg|jpeg|gif)$/i.test(bannerB)) {
      return message.reply(
        '❌ Please provide two valid image URLs.\nExample: `!set-banners https://example.com/a.png https://example.com/b.jpg`'
      );
    }

    db.data.settings = db.data.settings || {};
    db.data.settings.teamBanners = {
      [db.data.settings.teams[0]]: bannerA,
      [db.data.settings.teams[1]]: bannerB
    };

    await db.write();

    message.reply(`✅ Team banners updated successfully:\n🖼️ ${db.data.settings.teams[0]} → ${bannerA}\n🖼️ ${db.data.settings.teams[1]} → ${bannerB}`);
  }
};
