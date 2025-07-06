export default {
  name: 'delete-attack',
  description: 'Delete an attack by ID (mods only). Usage: !delete-attack <attackID>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const attackId = parseInt(args[0], 10);
    if (isNaN(attackId)) {
      return message.reply('Usage: !delete-attack <attackID>');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const index = db.data.attacks.findIndex(a => a.id === attackId);
    if (index === -1) {
      return message.reply('❌ Attack not found.');
    }

    const deleted = db.data.attacks.splice(index, 1)[0];
    await db.write();

    message.channel.send(`🗑️ Deleted attack from <@${deleted.from}> to <@${deleted.to}> (ID: ${attackId})`);
  }
};
