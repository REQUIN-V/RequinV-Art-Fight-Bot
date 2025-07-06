export default {
  name: 'delete-attack-mod',
  description: 'Delete any user’s attack by ID (mod-only). Usage: !delete-attack-mod <attackID>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const attackId = parseInt(args[0], 10);
    if (isNaN(attackId)) {
      return message.reply('❌ Usage: !delete-attack-mod <attackID>');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const index = db.data.attacks.findIndex(a => a.id === attackId);
    if (index === -1) {
      return message.reply('❌ Attack not found.');
    }

    const deleted = db.data.attacks.splice(index, 1)[0];

    // Also remove from attacker's gallery
    const user = db.data.users.find(u => u.id === deleted.from);
    if (user?.gallery) {
      user.gallery = user.gallery.filter(g => g.imageUrl !== deleted.imageUrl);
    }

    await db.write();

    message.channel.send(
      `🛠️ Moderator deleted attack from <@${deleted.from}> to <@${deleted.to}> (ID: ${attackId})`
    );
  }
};
