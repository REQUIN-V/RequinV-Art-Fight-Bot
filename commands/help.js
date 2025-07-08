import { EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'Show all available user commands.',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('🖌️🌸 Profic Art Fight – Commands Guide')
      .setColor(0xff9ecb)
      .setDescription(
        '📘 You can view the full bot documentation and usage guide here:\n' +
        '[**Profic Art Royal – Google Docs**](https://docs.google.com/document/d/1FtqzjUpLgx8J4nWUxm-aMWzbo7msvnl6vIbzQKvUhL8/preview?tab=t.0#heading=h.dlrvqsooc0h)\n\n' +
        '> ⚠️ **Disclaimer:** The bot currently cannot connect to permanent hosting servers due to cost limitations. As a result, **all data may be wiped during maintenance**. However, **maintenance will no longer occur after full release**. Download buttons for attacks and defenses are available to help users save submissions manually.'
      )
      .setFooter({ text: 'Use !help anytime to get this link again.' });

    return message.channel.send({ embeds: [embed] });
  }
};
