import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const cooldown = new Map();

export default {
  name: 'attack',
  description: 'Submit an attack. Usage: !attack @user <type> <tag> [description] (attach image)',
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
    const eventActive = serverData.settings?.eventActive;

    if (!eventActive) {
      return message.reply('🚫 There is no active event right now. You cannot submit attacks.');
    }

    const bannedUsers = serverData.settings?.bannedUsers || [];
    if (bannedUsers.some(u => u.id === message.author.id)) {
      return message.reply('🚫 You are banned from participating in this event.');
    }

    const authorId = message.author.id;
    const mention = message.mentions.users.first();
    if (!mention) return message.reply('❌ Usage: !attack @user <type> <tag> [description] (attach image)');
    args.shift(); // remove @mention

    const type = args[0]?.toLowerCase();
    const tag = args[1]?.toLowerCase();
    const description = args.slice(2).join(' ') || '';
    const attachment = message.attachments.first();

    if (!attachment || !attachment.url || !attachment.contentType) {
      return message.reply('❌ Please attach a valid image file (PNG, JPG, JPEG, etc).');
    }

    const imageUrl = attachment.url;
    const contentType = attachment.contentType;

    const allowedTypes = {
      wip: 50,
      doodle: 100,
      sketch: 200,
      lineart: 300,
      lineless: 400,
      'half body render': 500,
      'full body render': 600,
      animated: 700
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
    ) {
      return message.reply('❌ Only image files are allowed. No audio, video, or raw files.');
    }

    if (tag === '18+' && serverData.settings?.allow18 === false) {
      return message.reply('🚫 Submitting content tagged as `18+` is currently disabled for this event.');
    }

    if (!allowedTags.includes(tag)) {
      return message.reply(`❌ Invalid tag. Allowed tags: ${allowedTags.join(', ')}`);
    }

    const attacker = serverData.users.find(u => u.id === authorId);
    const target = serverData.users.find(u => u.id === mention.id);

    if (!attacker || !target) {
      return message.reply('❌ Either you or the target hasn’t registered a character yet.');
    }

    if (!attacker.team) {
      return message.reply('🚫 You must join a team first using `!join-team <teamName>` to attack.');
    }

    const isDuplicate = (serverData.attacks || []).some(a => a.from === authorId && a.imageUrl === imageUrl);
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

    serverData.attacks.push(attack);

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

    const filteredTags = target.filteredTags || [];
    const isFiltered = filteredTags.includes(tag);

    const embed = {
      title: `🎯 Attack by ${message.author.username}`,
      description:
        `Attacked ${mention.username} for **${points} points**\n` +
        `🎨 **Type:** ${type}\n` +
        `🏷️ **Tag:** ${tag}\n` +
        (description ? `📝 ${description}\n` : '') +
        `🆔 Attack ID: \`${attackId}\``,
      color: 0xff9ecb,
      footer: { text: 'Use the Attack ID if you want to delete or report it.' }
    };

    if (!isFiltered) {
      embed.image = { url: imageUrl };
    }

    const downloadRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('📥 Download')
        .setStyle(ButtonStyle.Link)
        .setURL(imageUrl)
    );

    await message.channel.send({ embeds: [embed], components: [downloadRow] });

    try {
      await mention.send({
        content: `🎯 You were attacked by **${message.author.username}**! Download the art below if you want to retaliate:` +
          (isFiltered ? `\n⚠️ This image was hidden due to your filter settings (${tag}).` : ''),
        embeds: [embed],
        components: [downloadRow]
      });
    } catch (e) {
      console.warn(`⚠️ Could not DM user ${mention.username}:`, e.message);
    }

    const logChannelId = serverData.settings?.logChannel;
    if (logChannelId) {
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel?.isTextBased()) {
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`deleteAttack:${attackId}`)
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setLabel('🚩 Report')
            .setStyle(ButtonStyle.Link)
            .setURL('https://report.cybertip.org/reporting')
        );
        logChannel.send({ embeds: [embed], components: [actionRow] });
      }
    }
  }
};

