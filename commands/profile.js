import { AttachmentBuilder } from 'discord.js';

export default {
  name: 'profile',
  description: 'View your profile or another user’s.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const target = message.mentions.users.first() || message.author;
    const user = db.data.users.find(u => u.id === target.id);

    if (!user) {
      return message.reply('❌ This user has not registered a character.');
    }

    const allAttacks = db.data.attacks || [];
    const attackPoints = allAttacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
    const defendPoints = allAttacks.filter(a => a.to === user.id).reduce((sum, a) => sum + a.points, 0);
    const teamName = user.team || 'None';

    const teamMembers = db.data.users.filter(u => u.team === teamName);
    const teamPoints = teamMembers.reduce((sum, member) => {
      return sum + allAttacks.filter(a => a.from === member.id).reduce((s, a) => s + a.points, 0);
    }, 0);

    const embed = {
      title: `${target.username}'s Profile`,
      color: 0xff9ecb,
      description:
        `**Team:** ${teamName}\n` +
        `**Attack Points:** ${attackPoints}\n` +
        `**Defend Points:** ${defendPoints}\n` +
        `**Team Contribution:** ${attackPoints} pts\n\n` +
        `•┈••✦ ❤ ✦••┈•\n` +
        `**User's Characters:**`,
      fields: []
    };

    if (user.characters && user.characters.length > 0) {
      for (const char of user.characters) {
        embed.fields.push({
          name: `🎭 ${char.name}`,
          value: char.imageUrl ? `[View Image](${char.imageUrl})` : 'No image provided',
          inline: false
        });
      }
    } else if (user.characterName) {
      embed.fields.push({
        name: `🎭 ${user.characterName}`,
        value: user.imageUrl ? `[View Image](${user.imageUrl})` : 'No image provided',
        inline: false
      });
    } else {
      embed.fields.push({ name: 'Characters', value: 'No characters registered yet.' });
    }

    await message.channel.send({ embeds: [embed] });
  }
};
