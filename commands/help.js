export default {
  name: 'help',
  description: 'Show all available commands.',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const isMod = message.member.permissions.has('ManageGuild');

    const commands = [
      { name: '!help', desc: 'Show this help menu' },
      { name: '!register-character <name>', desc: 'Register your character' },
      { name: '!join-team <TeamName>', desc: 'Join a team (after registering)' },
      {
        name: '!attack @user <type> <image_url> <tag> [description]',
        desc:
          `Submit an attack with art.\n` +
          `**Point Types:**\n` +
          `• sketch — 2 pts\n` +
          `• basic — 5 pts\n` +
          `• full-render — 10 pts\n` +
          `• animation — 15 pts\n` +
          `• wip — 1 pt\n\n` +
          `**Tags (required):** \`sfw\`, \`nsfw\`, \`gore\`, \`18+\`, \`spoiler\``
      },
      { name: '!profile [@user]', desc: 'View your (or another user\'s) profile' },
      { name: '!scoreboard', desc: 'View the current team points' },
      { name: '!my-attacks', desc: 'List your recent attacks' },
      { name: '!team-info', desc: 'Show current teams and theme' }
    ];

    const modCommands = [
      { name: '!set-theme <name>', desc: 'Set the current event theme [MOD]' },
      { name: '!set-event-teams TeamA TeamB', desc: 'Set team names [MOD]' },
      { name: '!assign-team @user Team', desc: 'Assign a user to a team [MOD]' },
      { name: '!delete-attack <ID>', desc: 'Delete an attack by ID [MOD]' }
    ];

    const embed = {
      title: '🖌️ Profic Art Royal Bot – Commands List',
      color: 0xff9ecb,
      description: 'Here are all available commands:',
      fields: [
        {
          name: '👤 General Commands',
          value: commands.map(cmd => `**${cmd.name}** – ${cmd.desc}`).join('\n\n')
        },
        {
          name: '🛠️ Moderator Commands',
          value: isMod
            ? modCommands.map(cmd => `**${cmd.name}** – ${cmd.desc}`).join('\n')
            : '🔒 You do not have permission to view these.'
        }
      ],
      footer: {
        text: 'Use !help anytime to view this list again.'
      }
    };

    message.channel.send({ embeds: [embed] });
  }
};

