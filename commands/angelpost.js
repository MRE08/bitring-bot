const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ALLOWED_CHANNEL_ID = '1484047680714965083';

const ALLOWED_ROLE_IDS = [
  '1477915085396512878',
  '1482822996732280882',
  '1482823757281366206'
];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePingMessage() {
  const messages = [
    '@everyone 🚨 New BitRing Angel drop just landed!',
    '@everyone 🔥 Fresh content just dropped!',
    '@everyone 🚀 New ambassordor content is live!',
    '@everyone 👀 You don’t want to miss this drop!'
  ];

  return random(messages);
}

function isTikTokLink(link) {
  return /tiktok\.com|vm\.tiktok\.com/i.test(link);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('angelpost')
    .setDescription('Post a new BitRing Angel content announcement')
    .addStringOption(option =>
      option
        .setName('link')
        .setDescription('Link to the post')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('caption')
        .setDescription('Caption for the announcement')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('style')
        .setDescription('Select the content style')
        .setRequired(true)
        .addChoices(
          { name: 'Hype', value: 'hype' },
          { name: 'Curiosity', value: 'curiosity' },
          { name: 'Educational', value: 'educational' },
          { name: 'Fitness', value: 'fitness' }
        )
    ),

  async execute(interaction) {
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return interaction.reply({
        content: `This command can only be used in <#${ALLOWED_CHANNEL_ID}>.`,
        ephemeral: true
      });
    }

    const hasAllowedRole = interaction.member.roles.cache.some(role =>
      ALLOWED_ROLE_IDS.includes(role.id)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const link = interaction.options.getString('link');
    const caption = interaction.options.getString('caption');
    const style = interaction.options.getString('style');

    const finalCaption = caption;
    const pingMessage = generatePingMessage();
    const tiktok = isTikTokLink(link);

    const embed = new EmbedBuilder()
      .setColor('#ecc412')
      .setTitle(tiktok ? '🎥 New BitRing Angel TikTok Drop' : '🚀 New BitRing Angel Drop')
      .setDescription(`**Style:** ${style}\n\n${finalCaption}\n\n${link}`)
      .setFooter({ text: `Posted by ${interaction.user.username}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(tiktok ? 'Watch Now' : 'Open Post')
        .setStyle(ButtonStyle.Link)
        .setURL(link)
    );

    await interaction.channel.send({
      content: pingMessage,
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: ['everyone'] }
    });

    await interaction.reply({
      content: 'Angel post announcement sent.',
      ephemeral: true
    });
  }
};