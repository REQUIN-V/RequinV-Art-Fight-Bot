import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

export default {
  name: 'profile',
  description: 'View your profile or another user’s.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const target = message.mentions.users.first() || message.author;
    const user = db.data.users.find(u => u.id === target.id);

    if (!user) return message.reply('❌ This user has not registered a character.');

    const allAttacks = db.data.attacks || [];
    const allDefends = db.data.defends || [];

    const userAttacks = allAttacks.filter(a => a.from === user.id);
    const userDefends = allDefends.filter(d => d.from === user.id);
    const attackPoints = userAttacks.reduce((sum, a) => sum + a.points, 0);
    const defendPoints = userDefends.reduce((sum, d) => sum + d.points, 0);

    const teamName = user.team || 'None';
    const teamMembers = db.data.users.filter(u => u.team === teamName);
    const teamPoints = teamMembers.reduce((sum, member) =>
      sum + allAttacks.filter(a => a.from === member.id).reduce((s, a) => s + a.points, 0), 0
    );

    // Default page is character gallery
    let currentPage = 'characters';
    let pageIndex = 0;

    const getPageData = () => {
      const itemsPerPage = 3;

      if (currentPage === 'characters') {
        const chars = user.characters || [];
        const pages = Math.ceil(chars.length / itemsPerPage) || 1;
        const sliced = chars.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

        return {
          embed: {
            title: `${target.username}'s Profile`,
            color: 0xff9ecb,
            description:
              `**Team:** ${teamName}\n` +
              `**Attack Points:** ${attackPoints}\n` +
              `**Defend Points:** ${defendPoints}\n` +
              `**Team Contribution:** ${attackPoints} pts\n\n` +
              `🎨 **Character Gallery** — Page ${pageIndex + 1} of ${pages}`,
            fields: sliced.map(c => ({
              name: `🎭 ${c.name}`,
              value:
                `${c.imageUrl ? `[View Image](${c.imageUrl})` : 'No image provided'}\n` +
                `🆔 ID: \`${c.id}\``,
              inline: false
            }))
          },
          hasPages: pages > 1
        };

      } else if (currentPage === 'attacks') {
        const pages = Math.ceil(userAttacks.length / itemsPerPage) || 1;
        const sliced = userAttacks.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

        return {
          embed: {
            title: `${target.username}'s Profile`,
            color: 0xff9ecb,
            description:
              `**Team:** ${teamName}\n` +
              `**Attack Points:** ${attackPoints}\n` +
              `**Defend Points:** ${defendPoints}\n` +
              `**Team Contribution:** ${attackPoints} pts\n\n` +
              `🏹 **Recent Attacks** — Page ${pageIndex + 1} of ${pages}`,
            fields: sliced.map(a => ({
              name: `🎯 Attack ID: \`${a.id}\``,
              value:
                `[View Art](${a.imageUrl}) – ${a.type} (${a.points} pts)` +
                `${a.tag ? ` | Tag: ${a.tag}` : ''}` +
                `${a.description ? `\n📝 ${a.description}` : ''}`,
              inline: false
            }))
          },
          hasPages: pages > 1
        };

      } else if (currentPage === 'defends') {
        const pages = Math.ceil(userDefends.length / itemsPerPage) || 1;
        const sliced = userDefends.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

        return {
          embed: {
            title: `${target.username}'s Profile`,
            color: 0xff9ecb,
            description:
              `**Team:** ${teamName}\n` +
              `**Attack Points:** ${attackPoints}\n` +
              `**Defend Points:** ${defendPoints}\n` +
              `**Team Contribution:** ${attackPoints} pts\n\n` +
              `🛡️ **Defenses** — Page ${pageIndex + 1} of ${pages}`,
            fields: sliced.map(d => ({
              name: `🛡️ Defense ID: \`${d.id}\``,
              value:
                `[View Defense](${d.imageUrl}) – ${d.type} (${d.points} pts)` +
                `${d.tag ? ` | Tag: ${d.tag}` : ''}` +
                `${d.description ? `\n📝 ${d.description}` : ''}`,
              inline: false
            }))
          },
          hasPages: pages > 1
        };
      }
    };

    const row = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('view_chars').setLabel('🎨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('view_attacks').setLabel('🏹').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('view_defends').setLabel('🛡️').setStyle(ButtonStyle.Primary)
    );

    const nav = (hasPages) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev_page').setLabel('↩️').setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === 0),
      new ButtonBuilder().setCustomId('next_page').setLabel('↪️').setStyle(ButtonStyle.Secondary).setDisabled(!hasPages)
    );

    const msg = await message.channel.send({
      embeds: [getPageData().embed],
      components: [row(), nav(getPageData().hasPages)]
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000
    });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: '❌ This menu isn’t for you.', ephemeral: true });
      }

      const totalPages = () => {
        const data = currentPage === 'characters' ? user.characters || [] :
                     currentPage === 'attacks' ? userAttacks :
                     userDefends;
        return Math.ceil(data.length / 3) || 1;
      };

      if (i.customId === 'view_chars') {
        currentPage = 'characters';
        pageIndex = 0;
      } else if (i.customId === 'view_attacks') {
        currentPage = 'attacks';
        pageIndex = 0;
      } else if (i.customId === 'view_defends') {
        currentPage = 'defends';
        pageIndex = 0;
      } else if (i.customId === 'next_page' && pageIndex < totalPages() - 1) {
        pageIndex++;
      } else if (i.customId === 'prev_page' && pageIndex > 0) {
        pageIndex--;
      }

      const { embed, hasPages } = getPageData();
      await i.update({
        embeds: [embed],
        components: [row(), nav(hasPages)]
      });
    });
  }
};

