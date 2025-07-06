export default {
  name: 'attack',
  description: 'Submit an attack with image, type, and tag. Usage: !attack @user type image_url tag [optional description]',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const author = message.author.id;
    const mention = message.mentions.users.first();
    const type = args[1]?.toLowerCase();
    const imageUrl = args[2];
    const tag = args[3]?.toLowerCase();
    const description = args.slice(4).join(' ') || '';

    const allowedTypes = {
      sketch: 2,
      basic: 5,
      'full-render': 10,
      animation: 15,
      wip: 1
    };

    const allowedTags = ['sfw', 'nsfw', 'gore', '18+', 'spoiler'];

    // Validate input
    if (!mention || !allowedTypes[type] || !imageUrl || !tag) {
      return message.reply(
        `❌ Usage: !attack @user <type> <image_url> <tag> [optional description]\n` +
        `Valid types: ${Object.keys(allowedTypes).join(', ')}\n` +
        `Valid tags: ${allowedTags.join(', ')}`
      );
    }

    if (!imageUrl.startsWith('http')) {
      return message.reply('❌ Please provide a valid image URL.');
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
      imageUrl,
      tag,
      points,
      description,
      timestamp: new Date().toISOString()
    };

    db.data.attacks.push(attack);
    await db.write();

    message.channel.send(
      `🎯 ${message.author.username} attacked ${mention.username} for **${points} points**!\n` +
      `🎨 Type: ${type} (${points} pts)\n` +
      `🏷️ Tag: \`${tag}\`\n` +
      `🖼️ [Art Link](${imageUrl})\n` +
      (description ? `📝 ${description}` : '')
    );
  }
};

