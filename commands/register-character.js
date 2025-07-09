import crypto from 'crypto';

export default {
  name: 'register-character',
  description: 'Register your character with a name and image attachment.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    const userId = message.author.id;

    const name = args.join(' ').trim();
    const attachment = message.attachments.first();

    if (!name || !attachment) {
      return message.reply('❌ Usage: !register-character <name> (with image attachment)');
    }

    const contentType = attachment.contentType || '';
    if (
      contentType.startsWith('audio/') ||
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream'
    ) {
      return message.reply('❌ Only image files are allowed. No audio or video files.');
    }

    const imageUrl = attachment.url;
    const charId = `${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;

    // Ensure server structure
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      teams: {},
      attacks: [],
      defenses: []
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

      const dupe = user.characters.find(
        c => c.name.toLowerCase() === name.toLowerCase() && c.imageUrl === imageUrl
      );
      if (dupe) {
        return message.reply('❌ You already registered this character.');
      }

      user.characters.push(newCharacter);
    } else {
      server.users.push({
        id: userId,
        characters: [newCharacter],
        gallery: [],
        defenses: [],
        team: null
      });
    }

    await db.write();

    return message.channel.send({
      content: `✅ Character **${name}** registered successfully!`,
      embeds: [{
        title: `🎨 New Character Registered`,
        description: `🆔 Character ID: \`${charId}\``,
        color: 0x93c5fd,
        image: { url: imageUrl }
      }]
    });
  }
};
