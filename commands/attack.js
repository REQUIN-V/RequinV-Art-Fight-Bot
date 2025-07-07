import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const cooldown = new Map();

export default {
  name: 'attack',
  description: 'Submit an attack. Usage: !attack @user <type> <tag> [description] (attach image)',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const eventActive = db.data.settings?.eventActive;
    if (!eventActive) {
      return message.reply('🚫 There is no active event right now. You cannot submit attacks.');
    }

    const authorId = message.author.id;
    const mention = message.mentions.users.first();
    if (!mention) return message.reply('❌ Usage: !attack @user <type> <tag> [description] (attach image)');
    args.shift(); // Remove @mention

    const type = args[0]?.toLowerCase();
    const tag = args[1]?.toLowerCase();
    const description = args.slice(2).join(' ') || '';
    const attachment = message.attachments.first();
    const imageUrl = attachment?.url;
    const contentType = attachment?.contentType || '';

    const allowedTypes = {
      sketch: 2,
      basic: 5,
      'full-render': 10,
      animation: 15,
      wip: 1
    };

    const allowedTags = ['sfw', 'nsfw', 'gore', '18+', 'spoiler'];

    if (!allowedTypes[type] || !tag || !imageUrl) {
      return message.reply(
        `❌ Usage: !attack @user <type> <tag> [description] (attach image)\n` +
        `**Valid Types:** ${Object.keys(allowedTypes).join(', ')}\n` +
        `**Valid Tags:** ${allowedTags.join(', ')}`
      );
    }

    if (
      contentType.startsWith('audio/') ||
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream'
    ) return message.reply('❌ Only image files are allowed. No audio or video files.');

    // 🔞 Optional tag restriction: check if 18+ tag is disabled
    if (tag === '18+' && db.data.settings?.allow18 === false) {
      return message.reply('🚫 Submitting content tagged as `18+` is currently disabled for this event.');
    }

    if (!allowedTags.includes(tag)) {
      return message.reply(`❌ Invalid tag. Allowed tags: ${allowedTags.join(', ')}`);
    }

    const attacker = db.data.users.find(u => u.id === authorId);
    const target = db.data.users.find(u => u.id === mention.id);

    if (!attacker || !target) {
      return message.reply('❌ Either you or the target hasn’t registered a character yet.');
    }

    if (!attacker.team) {
      return message.reply('🚫 You must join a team first using `!join-team <teamName>` to attack.');
    }

    const isDuplicate = (db.data.attacks || []).some(a => a.from === authorId && a.imageUrl === imageUrl);
    if (isDuplicate) return message.reply('⚠️ You already submitted this image before.');

    const cooldownTime = 300_000;
    const now = Date.now();
    if (cooldown.has(authorId) && now - cooldown.get(authorId) < cooldownTime) {
      const remaining = ((cooldownTime - (now - cooldown.get(authorId))) / 1000 / 60).toFixed(1);
      return message.reply(`⏳ Please wait ${remaining} more minute(s) before submitting another attack.`);
    }
    cooldown.set(authorId, now);

    const points = allowedTypes[type];
    const attackId = Date.now();

    const attack = {
      id: attackId,
      from: authorId,
      to: mention.id,
      type,
      tag,
      imageUrl,
      points,
      description,
      timestamp: new Date().toISOString()
    };

    db.data.attacks.push(attack);

    attacker.gallery = attacker.gallery || [];
    attacker.gallery.push({
      imageUrl,
      type,
      tag,
      points,
      description,
      timestamp: attack.timestamp
    });

    await db.write();

    const embed = {
      title: `🎯 Attack by ${message.author.username}`,
      description:
        `Attacked ${mention.username} for **${points} points**\n` +
        `🎨 **Type:** ${type}\n` +
        `🏷️ **Tag:** ${tag}\n` +
        (description ? `📝 ${description}\n` : '') +
        `🆔 Attack ID: \`${attackId}\``,
      color: 0xff9ecb,
      image: { url: imageUrl },
      footer: { text: 'Use the Attack ID if you want to delete or report it.' }
    };

    await message.channel.send({ embeds: [embed] });

    // 🔔 DM the mentioned user with a download button
    try {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📥 Download Attack Art')
          .setStyle(ButtonStyle.Link)
          .setURL(imageUrl)
      );

      await mention.send({
        content: `🎯 You were attacked by **${message.author.username}**! Download the art below if you want to retaliate:`,
        embeds: [embed],
        components: [row]
      });
    } catch (e) {
      console.warn(`Could not DM user ${mention.username}`);
    }

    // 🔒 Log to mod channel
    const logChannelId = db.data.settings?.logChannel;
    if (logChannelId) {
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel?.isTextBased()) {
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`deleteAttack:${attackId}`)
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`reportAttack:${attackId}`)
            .setLabel('🚩 Report')
            .setStyle(ButtonStyle.Secondary)
        );
        logChannel.send({ embeds: [embed], components: [actionRow] });
      }
    }
  }
};
