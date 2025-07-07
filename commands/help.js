export default {
  name: 'help',
  description: 'Show all available user commands.',
  async execute(message, args, client) {
    const embed = {
      title: '🖌️ Profic Art Royal Bot – Commands Guide',
      color: 0xff9ecb,
      description:
        '📘 You can view the full bot documentation and usage guide here:\n' +
        '[**Profic Art Royal – Google Docs**](https://docs.google.com/document/d/1FtqzjUpLgx8J4nWUxm-aMWzbo7msvnl6vIbzQKvUhL8/preview?tab=t.0#heading=h.dlrvqsooc0h)',
      footer: {
        text: 'Use !help anytime to get this link again.'
      }
    };

    return message.channel.send({ embeds: [embed] });
  }
};
