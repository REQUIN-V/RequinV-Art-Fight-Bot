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

    const attacks = gallery.slice(-4).reverse();
    const charName = user.characterName || 'Unnamed';
    const charImage = user.imageUrl;

    const embed = {
      title: `${target.username}'s Art Profile`,
      color: 0xff9ecb,
      fields: [
        {
          name: '🎭 Character Info',
          value:
            `**Name:** ${charName}\n` +
            `**XP:** ${totalXP}\n` +
            `**Rank:** Level ${level}\n` +
            `**Team:** ${user.team || 'None'}`
        },
        {
          name: '🖼️ Registered Character',
          value: `[View Image](${charImage})` || 'No character image set.'
        },
        {
          name: '🎯 Recent Attacks',
          value: attacks.length
            ? attacks.map((a, i) =>
                `**${i + 1}.** [Art](${a.imageUrl}) • ${a.points} pts • ${a.type}`
              ).join('\n')
            : 'No recent attacks.'
        }
      ],
      image: charImage ? { url: charImage } : undefined,
      footer: { text: `🧑 Showing character info and attack history` }
    };

    message.channel.send({ embeds: [embed] });
  }
};

