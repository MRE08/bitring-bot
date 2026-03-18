const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const text = message.content.toLowerCase().trim();

    if (text.includes('whitepaper')) {
      await message.reply('Here is the whitepaper: https://www.bitring.xyz/brt-protocol');
      return;
    }

    if (text.includes('docs')) {
      await message.reply('Here are the docs: https://www.bitring.xyz/brt-protocol');
      return;
    }

    if (text.includes('website')) {
      await message.reply('Here is the website: https://www.bitring.xyz');
      return;
    }

    if (text.includes('twitter') || text.includes('x account')) {
      await message.reply('Here is the X account: https://x.com/bitring2025');
    }
  },
};