export default {
  name: 'attack',
  description: 'Submit an attack with an image attachment, type, and tag. Usage: !attack @user <type> <tag> [optional description]',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const author = message.author.id;
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

    // Reject non-image file types
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

    const attacker = db.data.users.find(user => user.id === author);
    const target = db.data.users.find(user => user.id === mention.id);

    if (!attacker || !target) {
      return message.reply('❌ Either you or the target hasn’t registered a character yet.');
    }

    const points = allowedTypes[type];
    const attack = {
      id: Date.now(),
      from: author,
      to: mention.id,
      type,
      tag,
      imageUrl,
      points,
      description,
      timestamp: new Date().toISOString()
    };

    db.data.attacks.push(attack);

    // Store image in attacker's gallery
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

    message.channel.send(
      `🎯 ${message.author.username} attacked ${mention.username} for **${points} points**!\n` +
      `🎨 Type: ${type} (${points} pts)\n` +
      `🏷️ Tag: \`${tag}\`\n` +
      `🖼️ [View Art](${imageUrl})\n` +
      (description ? `📝 ${description}` : '')
    );
  }
};
