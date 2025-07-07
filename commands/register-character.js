import crypto from 'crypto';

export default {
  name: 'register-character',
  description: 'Register your character with a name and image attachment.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    const name = args.join(' ').trim();
    const attachment = message.attachments.first();

    if (!name || !attachment) {
      return message.reply('❌ Usage: !register-character <name> (with image attachment)');
    }

    const contentType = attachment.contentType || '';

    // Reject non-image file types
    if (
      contentType.startsWith('audio/') ||
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream'
    ) {
      return message.reply('❌ Only image files are allowed. No audio or video files.');
    }

    const imageUrl = attachment.url;
    const userId = message.author.id;
    const charId = `${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;

    // 🔧 Initialize server-specific data
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      teams: {},
      settings: {},
      attacks: [],
      defends: []
    };

    const server = db.data.servers[guildId];
    let user = server.users.find(u => u.id === userId);

    const newCharacter = {
      id: charId,
      name,
      imageUrl
    };

    if (user) {
      user.characters = user.characters || [];

      // Prevent duplicate characters
      const dupe = user.characters.find(c => c.name === name && c.imageUrl === imageUrl);
      if (dupe) {
        return message.reply('❌ You already registered this character.');
      }

      user.characters.push(newCharacter);
    } else {
      server.users.push({
        id: userId,
        characters: [newCharacter],
        gallery: [],
        team: null
      });
    }

    await db.write();

    message.channel.send(
      `✅ Character **${name}** registered successfully!\n🆔 Character ID: \`${charId}\``
    );
  }
};


