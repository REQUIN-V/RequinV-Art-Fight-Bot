export default {
  name: 'register-character',
  description: 'Register your character with a name and image attachment.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const name = args.join(' ').trim();
    const image = message.attachments.first();

    if (!name || !image) {
      return message.reply('❌ Usage: !register-character <name> (with image attachment)');
    }

    const imageUrl = image.url;
    if (!/\.(png|jpe?g|gif)$/i.test(imageUrl)) {
      return message.reply('❌ Please attach a valid image file (.png, .jpg, or .gif).');
    }

    // Prevent double register
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

