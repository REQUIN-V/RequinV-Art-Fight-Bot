export default {
  name: 'mod-help',
  description: 'Show all moderator-only commands.',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('🔒 You do not have permission to view moderator commands.');
    }

    const modCommands = [
      { name: '!set-theme <name>', desc: 'Set or update the current seasonal theme' },
      { name: '!set-event-teams <TeamA> <TeamB>', desc: 'Set current event teams' },
      { name: '!assign-team @user <Team>', desc: 'Assign a user to a team manually' },
      { name: '!delete-attack <attackID>', desc: 'Delete an attack using its ID' },
      { name: '!set-log-channel', desc: 'Set the current channel to log attacks' }
    ];

    const embed = {
      title: '🔧 Profic Art Royal – Moderator Commands',
      color: 0xf592bf,
      description: 'These commands are restricted to moderators:',
      fields: [
        {
          name: '🛠️ Moderator Commands',
          value: modCommands.map(cmd => `**${cmd.name}** – ${cmd.desc}`).join('\n\n')
        }
      ],
      footer: {
        text: 'Moderator access is required to use these commands.'
      }
    };

    await message.channel.send({ embeds: [embed] });
  }
};
