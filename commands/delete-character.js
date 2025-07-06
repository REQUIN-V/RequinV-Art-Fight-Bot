export default {
  name: 'delete-character',
  description: 'Delete your registered character (with confirmation).',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const user = db.data.users.find(u => u.id === userId);

    if (!user) {
      return message.reply('❌ You haven’t registered a character yet.');
    }

    const confirmMsg = await message.reply(
      '⚠️ Are you sure you want to **delete your character**? Type `yes` within 20 seconds to confirm.'
    );

    const filter = m => m.author.id === userId && m.content.toLowerCase() === 'yes';

    try {
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000,
        errors: ['time']
      });

      db.data.users = db.data.users.filter(u => u.id !== userId);
      await db.write();

      message.channel.send('✅ Your character has been deleted successfully.');
    } catch (error) {
      message.channel.send('❌ Character deletion cancelled or timed out.');
    }
  }
};
