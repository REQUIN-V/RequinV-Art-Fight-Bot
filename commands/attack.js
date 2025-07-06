const cooldown = new Map(); // Store cooldowns per user

export default {
  name: 'attack',
  description: 'Submit an attack with an image attachment, type, and tag. Usage: !attack @user <type> <tag> [optional description]',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const authorId = message.author.id;
    const mention = message.mentions.users.first();
    const type = args[1]?.toLowerCase();
    const tag = args[2]?.toLowerCase();
    const description = args.slice(3).join(' ') || '';
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

    if (!mention || !allowedTypes[type] || !tag || !imageUrl) {
      return message.reply(
        `❌ Usage: !attack @user <type> <tag> [optional description] (attach image)\n` +
        `Valid types: ${Object.keys(allowedTypes).join(', ')}\n` +
        `Valid tags: ${allowedTags.join(', ')}`
      );
    }

    if (
      contentType.startsWith('audio/') ||
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream'
    ) {
      return message.reply('❌ Only image files are allowed. No audio or video files.');
    }

    if (!allowedTags.includes(tag)) {
      return message.reply(`❌ Invalid tag. Allowed tags: ${allowedTags.join(', ')}`);
    }

    const attacker = db.data.users.find(user => user.id === authorId);
    const target = db.data.users.find(user => user.id === mention.id);

    if (!attacker || !target) {
      return message.reply('❌ Either you or the target hasn’t registered a character yet.');
    }

    // 🆔 Duplicate Prevention
    const isDuplicate = (db.data.attacks || []).some(a => a.from === authorId && a.imageUrl === imageUrl);
    if (isDuplicate) {
      return message.reply('⚠️ You already submitted this image before.');
    }

    // ⏱️ 5-Minute Cooldown
    const cooldownTime = 300_000; // 5 minutes in milliseconds
    const now = Date.now();
    if (cooldown.has(authorId) && now - cooldown.get(authorId) < cooldownTime) {
      const remaining = ((cooldownTime - (now - cooldown.get(authorId))) / 1000 / 60).toFixed(1);
      return message.reply(`⏳ Please wait ${remaining} more minute(s) before submitting another attack.`);
    }
    cooldown.set(authorId, now);

    const points = allowedTypes[type];
    const attackId = Date.now(); // Used as unique ID

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

    message.channel.send({ embeds: [embed] });
  }
};

