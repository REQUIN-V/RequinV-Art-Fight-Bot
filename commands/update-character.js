export default {
  name: 'update-character',
  description: 'Update your character’s name or image. Usage: !update-character <id> [new name] (attach new image)',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const userId = message.author.id;
    const charId = args[0];

    if (!charId) {
      return message.reply('❌ Usage: !update-character <id> [new name] (attach new image)');
    }

    const newName = args.slice(1).join(' ');
    const attachment = message.attachments.first();
    const contentType = attachment?.contentType || '';
    const imageUrl = attachment?.url;

    if (
      attachment &&
      (contentType.startsWith('audio/') ||
       contentType.startsWith('video/') ||
       contentType === 'application/octet-stream')
    ) {
      return message.reply('❌ Only image files are allowed. No audio or video files.');
    }

    const user = db.data.users.find(u => u.id === userId);
    if (!user || !user.characters) {
      return message.reply('❌ You don’t have any characters registered.');
    }

    const char = user.characters.find(c => c.id === charId);
    if (!char) {
      return message.reply(`❌ Character with ID \`${charId}\` not found.`);
    }

    if (!newName && !imageUrl) {
      return message.reply('❌ Provide a new name, new image, or both to update.');
    }

    if (newName) char.name = newName;
    if (imageUrl) char.imageUrl = imageUrl;

    await db.write();

    message.channel.send(`✅ Character \`${charId}\` updated successfully.`);
  }
};
