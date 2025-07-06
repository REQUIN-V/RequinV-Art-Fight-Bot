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

    const existing = db.data.users.find(u => u.id === message.author.id);
    if (existing) {
      return message.reply('❌ You already registered a character.');
    }

    db.data.users.push({
      id: message.author.id,
      characterName: name,
      imageUrl,
      gallery: [],
      team: null
    });

    await db.write();

    message.channel.send(`✅ Character **${name}** registered successfully!`);
  }
};


