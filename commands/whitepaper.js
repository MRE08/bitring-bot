const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitepaper')
    .setDescription('Posts the whitepaper embed'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('BitRing Whitepaper')
      .setDescription('Read the whitepaper here:\nhttps://www.bitring.xyz/brt-protocol')
      .setFooter({ text: 'BitRing Bot' });

    await interaction.reply({ embeds: [embed] });
  },
};