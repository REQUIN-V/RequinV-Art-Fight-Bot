export default {
  name: 'attack',
  description: 'Submit an attack with image and type. Usage: !attack @user type image_url [optional description]',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const author = message.author.id;
    const mention = message.mentions.users.first();
    const type = args[1]?.toLowerCase();
    const imageUrl = args[2];
    const description = args.slice(3).join(' ') || '';

    const allowedTypes = {
      sketch: 2,
      basic: 5,
      'full-render': 10,
      animation: 15,
      wip: 1
    };

    if (!mention || !allowedTypes[type] || !imageUrl) {
      return message.reply(
        `❌ Usage: !attack @user <type> <image_url> [optional description]\n` +
        `Valid types: ${Object.keys(allowedTypes).join(', ')}`
      );
    }

    if (!imageUrl.startsWith('http')) {
      return message.reply('❌ Please provide a valid image URL.');
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
      points,
      description
    };

    db.data.attacks.push(attack);
    await db.write();

    message.channel.send(
      `🎯 ${message.author.username} attacked ${mention.username} for **${points} points**!\n` +
      `🖼️ Type: ${type} | [Art Link](${imageUrl})\n` +
      `${description ? `📝 Description: ${description}` : ''}`
    );
  }
};
