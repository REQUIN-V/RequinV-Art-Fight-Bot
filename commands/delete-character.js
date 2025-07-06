export default {
  name: 'delete-character',
  description: 'Delete one of your registered characters by ID. Usage: !delete-character <characterID>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const charId = args[0]?.trim();

    if (!charId) {
      return message.reply('❌ Usage: !delete-character <characterID>');
    }

    const user = db.data.users.find(u => u.id === userId);

    if (!user || !Array.isArray(user.characters) || user.characters.length === 0) {
      return message.reply('❌ You haven’t registered any characters.');
    }

    const character = user.characters.find(c => c.id === charId);
    if (!character) {
      return message.reply(`❌ No character found with ID \`${charId}\`.`);
    }

    const confirmMsg = await message.reply(
      `⚠️ Are you sure you want to delete your character **"${character.name}"** (ID: \`${charId}\`)?\n` +
      `Please type \`yes\` within 20 seconds to confirm.`
    );

    const filter = m => m.author.id === userId && m.content.toLowerCase() === 'yes';

    try {
      await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000,
        errors: ['time']
      });

      // Remove the character
      user.characters = user.characters.filter(c => c.id !== charId);

      await db.write();

      message.channel.send(`✅ Character **"${character.name}"** has been deleted successfully.`);
    } catch (err) {
      message.channel.send('❌ Character deletion cancelled or timed out.');
    }
  }
};
