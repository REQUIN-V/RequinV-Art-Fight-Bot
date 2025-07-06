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

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];

    if (!validTypes.includes(attachment.contentType)) {
      return message.reply('❌ The file must be a PNG, JPG, or GIF.');
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


