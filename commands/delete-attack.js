export default {
  name: 'delete-attack',
  description: 'Delete an attack by ID (mods only). Usage: !delete-attack <attackID>',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const attackId = parseInt(args[0], 10);
    if (isNaN(attackId)) {
      return message.reply('❌ Usage: !delete-attack <attackID>');
    }

    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const guildId = message.guild.id;
    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defenses: []
    };

    const serverData = db.data.servers[guildId];
    const { attacks = [], defenses = [], users = [] } = serverData;

    const index = attacks.findIndex(a => a.id === attackId);
    if (index === -1) {
      return message.reply('❌ Attack not found.');
    }

    const deleted = attacks.splice(index, 1)[0];

    // 🧹 Remove from attacker's gallery
    const attacker = users.find(u => u.id === deleted.from);
    if (attacker?.gallery && Array.isArray(attacker.gallery)) {
      attacker.gallery = attacker.gallery.filter(entry =>
        !(entry.imageUrl === deleted.imageUrl && entry.timestamp === deleted.timestamp)
      );
    }

    // 🧼 Optional: remove related defenses for this attack
    serverData.defenses = defenses.filter(d => d.attackId !== deleted.id);

    await db.write();

    message.channel.send(
      `🗑️ Deleted attack from <@${deleted.from}> to <@${deleted.to}>.\n` +
      `🆔 Attack ID: \`${attackId}\` | 🎨 Type: **${deleted.type}** | 🏅 Points: **${deleted.points}**`
    );
  }
};

