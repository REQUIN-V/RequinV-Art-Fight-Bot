import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const defendCooldown = new Map();

export default {
  name: 'defend',
  description: 'Defend against a specific attack. Usage: !defend <attackID> <effort> <tag> [description] (attach image)',
  async execute(message, args) {
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
    const settings = serverData.settings || {};
    const allow18 = settings.allow18 !== false;

    // 🚫 Check if the user is banned (per-server)
    const bannedUsers = settings.bannedUsers || [];
    if (bannedUsers.some(u => u.id === message.author.id)) {
      return message.reply('🚫 You are banned from participating in this event.');
    }

    const defenderId = message.author.id;
    const attackId = args[0];

    const effort = args[1]?.toLowerCase();
    const tag = args[2]?.toLowerCase();
    const description = args.slice(3).join(' ') || '';
    const attachment = message.attachments.first();
    const imageUrl = attachment?.url;
    const contentType = attachment?.contentType || '';

    const effortLevels = {
      minimal: 1,
      partial: 3,
      solid: 5,
      refined: 8,
      'full-effort': 12
    };

    const allowedTags = ['sfw', 'nsfw', 'gore', '18+', 'spoiler'];

    if (!attackId || !effortLevels[effort] || !tag || !imageUrl) {
      return message.reply(
        `❌ Usage: !defend <attackID> <effort> <tag> [description] (attach image)\n` +
        `**Effort Levels:** ${Object.keys(effortLevels).join(', ')}\n` +
        `**Tags:** ${allowedTags.join(', ')}`
      );
    }

    if (
      contentType.startsWith('audio/') ||
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream'
    ) return message.reply('❌ Only image files are allowed. No audio or video files.');

    if (!allowedTags.includes(tag)) return message.reply(`❌ Invalid tag. Allowed tags: ${allowedTags.join(', ')}`);

    if (!allow18 && tag === '18+') {
      return message.reply('🔞 Submitting `18+` content is currently disabled by the moderators.');
    }

    const defender = serverData.users.find(u => u.id === defenderId);
    if (!defender) return message.reply('❌ You must register a character before defending.');

    const attack = (serverData.attacks || []).find(a => String(a.id) === attackId);
    if (!attack) return message.reply(`❌ No attack found with ID \`${attackId}\`.`);
    if (attack.to !== defenderId) return message.reply('❌ You can only defend against attacks targeting you.');

    serverData.defenses = serverData.defenses || [];

    const alreadyDefended = serverData.defenses.some(d => d.attackId === attack.id && d.from === defenderId);
    if (alreadyDefended) {
      return message.reply(`⚠️ You have already submitted a defense for attack ID \`${attackId}\`.`);
    }

    const isDuplicate = serverData.defenses.some(d => d.from === defenderId && d.imageUrl === imageUrl);
    if (isDuplicate) return message.reply('⚠️ You already submitted this image before.');

    const cooldownTime = 300_000;
    const now = Date.now();
    if (defendCooldown.has(defenderId) && now - defendCooldown.get(defenderId) < cooldownTime) {
      const remaining = ((cooldownTime - (now - defendCooldown.get(defenderId))) / 1000 / 60).toFixed(1);
      return message.reply(`⏳ Please wait ${remaining} more minute(s) before submitting another defense.`);
    }
    defendCooldown.set(defenderId, now);

    const points = effortLevels[effort];
    const defendId = Date.now();

    const defend = {
      id: defendId,
      attackId: attack.id,
      from: defenderId,
      to: attack.from,
      effort,
      tag,
      imageUrl,
      points,
      description,
      timestamp: new Date().toISOString()
    };

    serverData.defenses.push(defend);

    defender.defenses = defender.defenses || [];
    defender.defenses.push({
      imageUrl,
      effort,
      tag,
      points,
      description,
      attackId: attack.id,
      timestamp: defend.timestamp
    });

    await db.write();

    const embed = {
      title: `🛡️ Defense by ${message.author.username}`,
      description:
        `Defended against <@${attack.from}> for **${points} points**\n` +
        `💪 **Effort:** ${effort}\n` +
        `🏷️ **Tag:** ${tag}\n` +
        `🗡️ Original Attack ID: \`${attack.id}\`\n` +
        (description ? `📝 ${description}\n` : '') +
        `🆔 Defend ID: \`${defendId}\``,
      color: 0x8bd3ff,
      image: { url: imageUrl },
      footer: { text: 'Use the Defend ID if you want to delete or report it.' }
    };

    await message.channel.send({ embeds: [embed] });

    // DM the original attacker with a download button
    try {
      const downloadRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📥 Download Defense Art')
          .setStyle(ButtonStyle.Link)
          .setURL(imageUrl)
      );

      const attackerUser = await message.client.users.fetch(attack.from);
      await attackerUser.send({
        content: `🛡️ You were defended against by **${message.author.username}**! Download the defense art below if you'd like to retaliate:`,
        embeds: [embed],
        components: [downloadRow]
      });
    } catch (err) {
      console.warn('Could not DM original attacker.');
    }

    // Log to mod channel
    const logChannelId = settings?.logChannel;
    if (logChannelId) {
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel?.isTextBased()) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`deleteDefend:${defendId}`)
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`reportDefend:${defendId}`)
            .setLabel('🚩 Report')
            .setStyle(ButtonStyle.Secondary)
        );
        await logChannel.send({ embeds: [embed], components: [row] });
      }
    }
  }
};
