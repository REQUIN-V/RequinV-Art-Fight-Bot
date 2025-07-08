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

    const guildId = message.guild.id;
    const target = message.mentions.users.first() || message.author;

    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: {}
    };

    const server = db.data.servers[guildId];

    const user = server.users.find(u => u.id === target.id);
    if (!user) {
      return message.reply('❌ This user has not registered a character.');
    }

    const allAttacks = server.attacks || [];
    const allDefends = server.defends || [];

    const attackPoints = allAttacks.filter(a => a.from === user.id).reduce((sum, a) => sum + a.points, 0);
    const defendPoints = allDefends.filter(d => d.from === user.id).reduce((sum, d) => sum + d.points, 0);
    const teamName = user.team || 'None';

    const teamMembers = server.users.filter(u => u.team === teamName);
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
        return { embed };
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
        return { embed };
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
          const downloadRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('📥 Download')
              .setStyle(ButtonStyle.Link)
              .setURL(atk.imageUrl)
          );
          return { embed, components: [downloadRow] };
        }
        return { embed };
      }

      if (section === 'defends') {
        const defends = allDefends.filter(d => d.from === user.id).reverse();
        const def = defends[page];
        if (!def) {
          embed.setTitle('🛡️ No more defenses.').setDescription('Try a different page.');
        } else {
          embed.setTitle(`🛡️ Defense ID: ${def.id}`);
          embed.setDescription(
            `🎨 Type: ${def.effort} (${def.points} pts)\n` +
            `🏷️ Tag: ${def.tag}\n` +
            (def.description ? `📝 ${def.description}` : '')
          );
          embed.setImage(def.imageUrl);
          const downloadRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('📥 Download')
              .setStyle(ButtonStyle.Link)
              .setURL(def.imageUrl)
          );
          return { embed, components: [downloadRow] };
        }
        return { embed };
      }

      embed.setFooter({ text: `Page ${page + 1}` });
      return { embed };
    };

    const makeButtons = () => {
      const sectionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('section:summary').setLabel('ℹ️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:characters').setLabel('🎨').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:attacks').setLabel('🏹').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('section:defends').setLabel('🛡️').setStyle(ButtonStyle.Secondary)
      );

      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('page:prev').setLabel('↩️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('page:next').setLabel('↪️').setStyle(ButtonStyle.Primary)
      );

      return [sectionRow, navRow];
    };

    const { embed, components } = getEmbed(state.section, state.page);

    const sent = await message.channel.send({
      embeds: [embed],
      components: [...makeButtons(), ...(components || [])]
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

      const { embed: newEmbed, components: extraButtons } = getEmbed(state.section, state.page);
      await interaction.update({
        embeds: [newEmbed],
        components: [...makeButtons(), ...(extraButtons || [])]
      });
    });
  }
};
