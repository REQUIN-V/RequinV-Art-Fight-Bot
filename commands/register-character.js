export default {
  name: 'register-character',
  description: 'Register your character. Usage: !register-character <character name>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const characterName = args.join(' ');

    if (!characterName) {
      return message.reply('❌ Please provide a character name. Usage: !register-character <name>');
    }

    // Check if already registered
    const existing = db.data.users.find(user => user.id === userId);
    if (existing) {
      return message.reply('⚠️ You have already registered a character.');
    }

    db.data.users.push({
      id: userId,
      username: message.author.username,
      character: characterName,
      team: null
    });

    await db.write();

    message.channel.send(`✅ ${message.author.username}, your character **${characterName}** has been registered!`);
  }
};
