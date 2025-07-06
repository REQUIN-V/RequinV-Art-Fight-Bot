export default {
  name: 'profile',
  description: 'View your profile or another user\'s. Usage: !profile [@user]',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const target = message.mentions.users.first() || message.author;
    const userData = db.data.users.find(user => user.id === target.id);

    if (!userData) {
      return message.reply(`❌ ${target.username} has not registered a character yet.`);
    }

    const attacks = db.data.attacks.filter(a => a.from === target.id);
    const totalPoints = attacks.reduce((sum, a) => sum + a.points, 0);

    // XP & Ranks based on total points
    const getRank = (points) => {
      if (points >= 100) return '🌟 Master Artist';
      if (points >= 50) return '🎨 Advanced';
      if (points >= 20) return '✏️ Intermediate';
      if (points >= 5) return '📌 Beginner';
      return '🧃 Newbie';
    };

    const galleryLinks = attacks
      .slice(-3) // latest 3 attacks
      .map(a => `[Artwork](${a.imageUrl})`)
      .join('\n') || 'No artwork submitted yet.';

    const embed = {
      title: `${target.username}'s Profile`,
      color: 0xff9ecb,
      fields: [
        { name: 'Character', value: userData.character || 'Unnamed', inline: true },
        { name: 'Team', value: userData.team || 'None', inline: true },
        { name: 'Total Points', value: totalPoints.toString(), inline: true },
        { name: 'XP Rank', value: getRank(totalPoints), inline: true },
        { name: 'Gallery (Last 3)', value: galleryLinks }
      ],
      footer: {
        text: 'Profic Art Royal'
      }
    };

    message.channel.send({ embeds: [embed] });
  }
};
