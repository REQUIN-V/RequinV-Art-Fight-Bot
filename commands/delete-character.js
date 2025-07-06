export default {
  name: 'delete-character',
  description: 'Delete one of your registered characters by ID. Usage: !delete-character <characterID>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const charId = args[0];

    const user = db.data.users.find(u => u.id === userId);

    if (!user || !user.characters || user.characters.length === 0) {
      return message.reply('❌ You haven’t registered any characters.');
    }

    if (!charId) {
      return message.reply('❌ Usage: !delete-character <characterID>');
    }

    const character = user.characters.find(c => c.id === charId);
    if (!character) {
      return message.reply('❌ No character found with that ID.');
    }

    const confirmMsg = await message.reply(
      `⚠️ Are you sure you want to **delete your character "${character.name}"**?\n` +
      `Type \`yes\` within 20 seconds to confirm.`
    );

    const filter = m => m.author.id === userId && m.content.toLowerCase() === 'yes';

    try {
      await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000,
        errors: ['time']
      });

      user.characters = user.characters.filter(c => c.id !== charId);
      await db.write();

      message.channel.send(`✅ Character **${character.name}** (ID: \`${charId}\`) has been deleted.`);
    } catch (error) {
      message.channel.send('❌ Character deletion cancelled or timed out.');
    }
  }
};

