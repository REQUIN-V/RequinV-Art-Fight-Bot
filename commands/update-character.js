export default {
  name: 'update-character',
  description: 'Update your character’s name or image. Usage: !update-character <id> [new name] (attach new image)',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    const userId = message.author.id;
    const charId = args[0];

    if (!charId) {
      return message.reply('❌ Usage: !update-character <id> [new name] (attach new image)');
    }

    const newName = args.slice(1).join(' ').trim();
    const attachment = message.attachments.first();
    const contentType = attachment?.contentType || '';
    const imageUrl = attachment?.url;

    if (
      attachment &&
      (contentType.startsWith('audio/') ||
       contentType.startsWith('video/') ||
       contentType === 'application/octet-stream')
    ) {
      return message.reply('❌ Only image files are allowed. No audio or video files.');
    }

    // 🛡️ Ensure server data exists
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: {}
    };

    const server = db.data.servers[guildId];

    const user = server.users.find(u => u.id === userId);
    if (!user || !user.characters || user.characters.length === 0) {
      return message.reply('❌ You don’t have any registered characters.');
    }

    const character = user.characters.find(c => String(c.id) === String(charId));
    if (!character) {
      return message.reply(`❌ Character with ID \`${charId}\` not found.`);
    }

    if (!newName && !imageUrl) {
      return message.reply('❌ You must provide a new name, new image, or both to update.');
    }

    if (newName) character.name = newName;
    if (imageUrl) character.imageUrl = imageUrl;

    await db.write();

    return message.channel.send(`✅ Character \`${charId}\` updated successfully!`);
  }
};
