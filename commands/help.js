export default {
  name: 'help',
  description: 'Show all available commands.',
  async execute(message) {
    const db = (await import('../utils/db.js')).getDB();
    await db.read();

    const isMod = message.member.permissions.has('ManageGuild');

    const commands = [
      { name: '!help', desc: 'Show this help menu' },
      { name: '!register-character <name> (attach image)', desc: 'Register a character with a name and image' },
      { name: '!update-character <id> [new name] (attach image)', desc: 'Update your character’s name/image' },
      { name: '!delete-character', desc: 'Delete all your characters (with confirmation)' },
      { name: '!join-team <TeamName>', desc: 'Join an event team after registering' },
      {
        name: '!attack @user <type> <tag> [description] (attach image)',
        desc:
          `Submit an art attack on a user\n` +
          `**Point Types:**\n` +
          `• sketch — 2 pts\n` +
          `• basic — 5 pts\n` +
          `• full-render — 10 pts\n` +
          `• animation — 15 pts\n` +
          `• wip — 1 pt\n\n` +
          `**Tags:** \`sfw\`, \`nsfw\`, \`gore\`, \`18+\`, \`spoiler\`\n` +
          `⏳ Cooldown: 5 minutes\n🆔 Each attack has a unique ID`
      },
      { name: '!profile [@user]', desc: 'View your or another user’s full profile, characters, and attacks' },
      { name: '!my-attacks', desc: 'List your submitted attacks' },
      { name: '!scoreboard', desc: 'View current live team scores' },
      { name: '!leaderboard', desc: 'Show ranked team leaderboard' },
      { name: '!team-info', desc: 'View current team names and theme for the event' }
    ];

    const modCommands = [
      { name: '!set-theme <name>', desc: 'Set or update the current seasonal theme [MOD]' },
      { name: '!set-event-teams <TeamA> <TeamB>', desc: 'Set current event teams [MOD]' },
      { name: '!assign-team @user <Team>', desc: 'Assign a user to a team manually [MOD]' },
      { name: '!delete-attack <attackID>', desc: 'Delete an attack using its ID [MOD]' }
    ];

    const embed = {
      title: '🖌️ Profic Art Royal Bot – Commands List',
      color: 0xff9ecb,
      description: 'All commands available to you:',
      fields: [
        {
          name: '👤 General Commands',
          value: commands.map(cmd => `**${cmd.name}** – ${cmd.desc}`).join('\n\n')
        },
        {
          name: '🛠️ Moderator Commands',
          value: isMod
            ? modCommands.map(cmd => `**${cmd.name}** – ${cmd.desc}`).join('\n\n')
            : '🔒 You do not have permission to view these.'
        }
      ],
      footer: {
        text: 'Use !help anytime to view this list again.'
      }
    };

    await message.channel.send({ embeds: [embed] });
  }
};


