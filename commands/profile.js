import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

export default {
  name: 'profile',
  description: 'View your profile or another user’s.',
  async execute(message, args) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const target = message.mentions.users.first() || message.author;
    const user = db.data.users.find(u => u.id === target.id);
    if (!user) {
      await message.reply('❌ This user has not registered a character.');
      return;
    }

    const allAttacks = db.data.attacks || [];
    const allDefends = db.data.defends || [];

    const attackPoints = allAttacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
    const defendPoints = allDefends.filter(d => d.from === user.id).reduce((sum, d) => sum + d.points, 0);
    const teamName = user.team || 'None';

    const teamMembers = db.data.users.filter(u => u.team === teamName);
    const teamPoints = teamMembers.reduce((sum, member) =>
      sum + allAttacks.filter(a => a.from === member.id).reduce((s, a) => s + a.points, 0), 0
    );

    let state = { section: 'summary', page: 0 };

    const getEmbed = (section, page) => {
      const embed = new EmbedBuilder().setColor(0xff9ecb);

      if (section === 'summary') {
        embed
          .setTitle(`${target.username}'s Profile`)
          .setDescription(
            `**Team:** ${teamName}\n` +
            `**Attack Points:** ${attackPoints}\n` +
            `**Defend Points:** ${defendPoints}\n` +
            `**Team Contribution:** ${attackPoints} pts`
          );
        return embed;
      }

      if (section === 'characters') {
        const characters = user.characters || [];
        const char = characters[page];
        if (!char) {
          embed.setTitle('🎨 No more characters.').setDescription('Try a different page.');
        } else {
          embed.setTitle(`🎨 ${char.name}`);
          embed.setDescription(`🆔 ID: \`${char.id || 'unassigned'}\``);
          if (char.imageUrl) embed.setImage(char.imageUrl);
        }
      }

      if (section === 'attacks') {
        const attacks = allAttacks.filter(a => a.from === user.id).reverse();
        const atk = attacks[page];
        if (!atk) {
          embed.setTitle('🏹 No more attacks.').setDescription('Try a different page.');
        } else {
          embed.setTitle(`🏹 Attack ID: ${atk.id}`);
          embed.setDescription(
            `🎨 Type: ${atk.type} (${atk.points} pts)\n` +
            `🏷️ Tag: ${atk.tag}\n` +
            (atk.description ? `📝 ${atk.description}` : '')
          );
          embed.setImage(atk.imageUrl);
        }
      }

      if (section === 'defends') {
        const defends = allDefends.filter(d => d.from === user.id).reverse();
        const def = defends[page];
        if (!def) {
          embed.setTitle('🛡️ No more defenses.').setDescription('Try a different page.');
        } else {
          embed.setTitle(`🛡️ Defense ID: ${def.id}`);
          embed.setDescription(
            `🎨 Type: ${def.type} (${def.points} pts)\n` +
            `🏷️ Tag: ${def.tag}\n` +
            (def.description ? `📝 ${def.description}` : '')
          );
          embed.setImage(def.imageUrl);
        }
      }

      embed.setFooter({ text: `Page ${page + 1}` });
      return embed;
    };

    const makeButtons = () => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('section:summary').setLabel('ℹ️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:characters').setLabel('🎨').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:attacks').setLabel('🏹').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:defends').setLabel('🛡️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('page:prev').setLabel('↩️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('page:next').setLabel('↪️').setStyle(ButtonStyle.Primary)
      );
    };

    const sent = await message.channel.send({
      embeds: [getEmbed(state.section, state.page)],
      components: [makeButtons()]
    });

    const collector = sent.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Not your profile.', ephemeral: true });
      }

      if (interaction.customId.startsWith('section:')) {
        state.section = interaction.customId.split(':')[1];
        state.page = 0;
      }

      if (interaction.customId === 'page:next') state.page += 1;
      if (interaction.customId === 'page:prev' && state.page > 0) state.page -= 1;

      await interaction.update({
        embeds: [getEmbed(state.section, state.page)],
        components: [makeButtons()]
      });
    });
  }
};
