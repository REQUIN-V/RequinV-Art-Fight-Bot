import crypto from 'crypto';

export default {
  name: 'register-character',
  description: 'Register your character with a name and image attachment.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const name = args.join(' ').trim();
    const attachment = message.attachments.first();

    if (!name || !attachment) {
      return message.reply('❌ Usage: !register-character <name> (with image attachment)');
    }

    const contentType = attachment.contentType || '';

    // Reject non-image file types (audio/video/binary)
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

    let user = db.data.users.find(u => u.id === userId);

    const newCharacter = {
      id: charId,
      name,
      imageUrl
    };

    if (user) {
      user.characters = user.characters || [];

      // Prevent duplicates with same name or exact image
      const dupe = user.characters.find(c => c.name === name && c.imageUrl === imageUrl);
      if (dupe) {
        return message.reply('❌ You already registered this character.');
      }

      user.characters.push(newCharacter);
    } else {
      db.data.users.push({
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

