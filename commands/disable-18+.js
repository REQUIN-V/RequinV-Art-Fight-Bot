import { getDB } from '../utils/db.js';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';

export default {
  name: 'disable-18+',
  description: '🔞 Disable the ability to submit 18+ tagged artwork (mods only)',
  async execute(message) {
    const guildId = message.guild.id;

    // 1. Permission check
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply({
        content: '❌ You do not have permission to use this command. (`ManageMessages` required)',
        ephemeral: true
      });
    }

    // 2. Read DB and ensure server structure exists
    const db = getDB();
    await db.read();

    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      settings: {},
      users: [],
      attacks: [],
      defenses: []
    };

    db.data.servers[guildId].settings.allow18 = false;
    await db.write();

    // 3. Build response embed
    const embed = new EmbedBuilder()
      .setTitle('🔞 18+ Content Disabled')
      .setDescription('Users can no longer submit attacks or defenses with the `18+` tag in this server.')
      .setColor(0xff4b4b)
      .setFooter({ text: `Updated by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    // 4. Send confirmation
    await message.channel.send({ embeds: [embed] });
  }
};
