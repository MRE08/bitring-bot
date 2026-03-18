const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('docs')
    .setDescription('Posts the docs embed'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('BitRing Docs')
      .setDescription('Access the official docs here:\nhttps://www.bitring.xyz/brt-protocol')
      .setFooter({ text: 'BitRing Bot' });

    await interaction.reply({ embeds: [embed] });
  },
};