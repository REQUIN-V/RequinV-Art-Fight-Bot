client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, attackId] = interaction.customId.split(':');
  if (action !== 'deleteAttack') return;

  const db = (await import('./utils/db.js')).getDB();
  await db.read();

  const guildId = interaction.guild.id;
  const server = db.data.servers?.[guildId];
  if (!server) return;

  const isMod = interaction.member.permissions.has('ManageMessages');
  if (!isMod) {
    return interaction.reply({ content: '❌ You don’t have permission to do that.', ephemeral: true });
  }

  const attackIndex = server.attacks.findIndex(a => String(a.id) === attackId);
  if (attackIndex === -1) {
    return interaction.reply({ content: `⚠️ Attack not found.`, ephemeral: true });
  }

  const deleted = server.attacks.splice(attackIndex, 1)[0];

  const attacker = server.users.find(u => u.id === deleted.from);
  if (attacker?.gallery) {
    attacker.gallery = attacker.gallery.filter(g =>
      !(g.imageUrl === deleted.imageUrl && g.timestamp === deleted.timestamp && g.points === deleted.points)
    );
  }

  await db.write();

  await interaction.reply({
    content: `🗑️ Deleted attack by <@${deleted.from}> (ID: \`${attackId}\`)`,
    ephemeral: true
  });
});
