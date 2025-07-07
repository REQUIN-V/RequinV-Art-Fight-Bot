export default {
  name: 'help',
  description: 'Show a link to the full command documentation.',
  async execute(message) {
    const embed = {
      title: '📖 Profic Art Royal Bot – Full Command Guide',
      description: 'Click the link below to view the full documentation with all commands, usage, and examples:',
      color: 0xff9ecb,
      fields: [
        {
          name: '📄 Google Docs:',
          value: '[Open Documentation](https://docs.google.com/document/d/1FtqzjUpLgx8J4nWUxm-aMWzbo7msvnl6vIbzQKvUhL8/preview)'
        }
      ],
      footer: {
        text: 'Use !help anytime to get this link again.'
      }
    };

    await message.channel.send({ embeds: [embed] });
  }
};

