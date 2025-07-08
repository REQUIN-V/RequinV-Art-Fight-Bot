export default {
  name: 'filter-tag',
  description: 'Filter specific tags from attacks (e.g. 18+, spoiler). Usage: !filter-tag <tag>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    const userId = message.author.id;
    const tag = args[0]?.toLowerCase();

    const allowedTags = ['18+', 'spoiler', 'gore', 'nsfw'];

    if (!tag || !allowedTags.includes(tag)) {
      return message.reply(
        `❌ Invalid or missing tag.\n` +
        `✅ Usage: \`!filter-tag <tag>\`\n` +
        `Allowed tags: \`${allowedTags.join(', ')}\``
      );
    }

    // Ensure server & user structure
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      settings: {},
      attacks: [],
      defenses: []
    };

    const server = db.data.servers[guildId];
    const user = server.users.find(u => u.id === userId);

    if (!user) {
      return message.reply('❌ You must register a character before using tag filters.');
    }

    user.filteredTags = user.filteredTags || [];

    if (user.filteredTags.includes(tag)) {
      // Remove the tag (toggle off)
      user.filteredTags = user.filteredTags.filter(t => t !== tag);
      await db.write();
      return message.reply(`✅ Tag \`${tag}\` has been **unfiltered**.`);
    } else {
      // Add the tag (toggle on)
      user.filteredTags.push(tag);
      await db.write();
      return message.reply(`✅ Tag \`${tag}\` has been **filtered**. You will no longer see embedded images with this tag.`);
    }
  }
};
