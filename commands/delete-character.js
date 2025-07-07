export default {
  name: 'delete-character',
  description: 'Delete one of your registered characters by ID. Usage: !delete-character <characterID>',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const guildId = message.guild.id;
    const charId = args[0]?.trim();

    if (!charId) {
      return message.reply('❌ Usage: !delete-character <characterID>');
    }

    // Ensure server data exists
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defenses: []
    };

    const serverData = db.data.servers[guildId];

    // Find the user entry in this server
    const user = serverData.users.find(u => u.id === userId);
    if (!user || !Array.isArray(user.characters) || user.characters.length === 0) {
      return message.reply('❌ You haven’t registered any characters.');
    }

    const characterIndex = user.characters.findIndex(
      c => c.id?.toLowerCase() === charId.toLowerCase()
    );

    if (characterIndex === -1) {
      return message.reply(`❌ No character with ID \`${charId}\` found in your profile.`);
    }

    const character = user.characters[characterIndex];

    const confirmMsg = await message.reply(
      `⚠️ Are you sure you want to delete your character **"${character.name}"** (ID: \`${character.id}\`)?\n` +
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

      user.characters.splice(characterIndex, 1);
      await db.write();

      message.channel.send(`✅ Character **"${character.name}"** has been deleted successfully.`);
    } catch (err) {
      message.channel.send('❌ Character deletion cancelled or timed out.');
    }
  }
};
