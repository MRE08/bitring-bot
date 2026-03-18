const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('links')
    .setDescription('Posts the official links embed'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('BitRing Official Links')
      .setDescription(
        [
          '**Website**: https://www.bitring.xyz',
          '**Docs**: https://www.bitring.xyz/brt-protocol',
          '**Whitepaper**: https://www.bitring.xyz/brt-protocol',
          '**X**: https://x.com/bitring2025'
        ].join('\n')
      )
      .setFooter({ text: 'BitRing Bot' });

    await interaction.reply({ embeds: [embed] });
  },
};