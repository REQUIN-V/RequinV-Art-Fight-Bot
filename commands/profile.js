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

    const totalXP = (db.data.attacks || [])
      .filter(a => a.from === user.id)
      .reduce((sum, a) => sum + a.points, 0);

    const level = Math.floor(totalXP / 20) + 1;
    const gallery = user.gallery || [];
    const recentImages = gallery.slice(-4).map(g => g.imageUrl);

    const embed = {
      title: `${target.username}'s Character Profile`,
      color: 0xff9ecb,
      fields: [
        { name: '🎭 Name', value: user.characterName, inline: true },
        { name: '🧠 XP', value: `${totalXP} XP`, inline: true },
        { name: '⭐ Rank', value: `Level ${level}`, inline: true },
        { name: '🏳️ Team', value: user.team || 'None', inline: true }
      ],
      image: recentImages[0] ? { url: recentImages[0] } : undefined,
      footer: { text: gallery.length ? `🖼️ Showing 1 of ${gallery.length} art submissions` : '' }
    };

    await message.channel.send({ embeds: [embed] });
  }
};

