import { getDB } from '../utils/db.js';
import { backupToGist } from '../utils/gist-backup.js';

export default {
  name: 'reset-scoreboard',
  description: '🔄 Reset all scoreboard data (attacks & defenses) for a new event. (Mod-only)',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const db = getDB();
    await db.read();

    const guildId = message.guild.id;

    db.data.servers = db.data.servers || {};
    db.data.servers[guildId] = db.data.servers[guildId] || {
      users: [],
      attacks: [],
      defends: [],
      settings: {},
      teams: {}
    };

    const server = db.data.servers[guildId];

    // 🔐 Backup before clearing data
    await backupToGist();

    // Clear attack and defense data
    server.attacks = [];
    server.defends = [];

    // Reset user-specific attack/defense stats but keep characters and teams
    for (const user of server.users) {
      user.attacks = [];
      user.defenses = [];
    }

    await db.write();

    message.channel.send('✅ Scoreboard has been reset for the next event. All attacks and defenses cleared.');
  }
};

