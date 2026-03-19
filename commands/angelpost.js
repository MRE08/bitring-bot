const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ALLOWED_CHANNEL_ID = '1484047680714965083';

const ALLOWED_ROLE_IDS = [
  '1477915085396512878',
  '1482822996732280882',
  '1482823757281366206'
];

// Random helper
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Caption generator
function generateCaption(style) {
  const captions = {
    hype: [
      'New BitRing Angel drop just landed 🚀👇',
      'Fresh content from a BitRing Angel 🔥 Tap in 👇',
      'This one is too good to miss 👇',
      'Big drop just went live 🚀👇'
    ],
    curiosity: [
      'Most people are still sleeping on this 👇',
      'You need to see this 👇',
      'This is where things get interesting 👇',
      'Watch this and you’ll get it 👇'
    ],
    educational: [
      'Quick breakdown you should watch 👇',
      'This explains BitRing clearly 👇',
      'Useful insight for anyone getting started 👇',
      'Watch this for a better understanding 👇'
    ],
    fitness: [
      'Fitness meets Web3 👇',
      'Train. Track. Earn. Watch this 👇',
      'This is how BitRing connects movement and rewards 👇',
      'If you’re into fitness, check this out 👇'
    ],
    default: [
      'Check out the new post from our BitRing Angel 👇',
      'New content just dropped 👇',
      'Fresh BitRing Angel content is live 👇'
    ]
  };

  return random(captions[style] || captions.default);
}

// @everyone message generator
function generatePingMessage() {
  const messages = [
    '@everyone 🚨 New BitRing Angel drop just landed!',
    '@everyone 🔥 Fresh content just dropped!',
    '@everyone 🚀 New ambassordor content is live!',
    '@everyone 👀 You don’t want to miss this drop!'
  ];

  return random(messages);
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
        .setDescription('Optional custom caption')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('style')
        .setDescription('Auto caption style')
        .setRequired(false)
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
    const customCaption = interaction.options.getString('caption');
    const style = interaction.options.getString('style') || 'default';

    const finalCaption = customCaption || generateCaption(style);
    const pingMessage = generatePingMessage();

    const embed = new EmbedBuilder()
      .setColor('#00b0f4')
      .setTitle('🚀 New BitRing Angel Drop')
      .setDescription(`${finalCaption}\n\n${link}`)
      .setFooter({ text: `Posted by ${interaction.user.username}` });

    await interaction.channel.send({
      content: pingMessage,
      embeds: [embed],
      allowedMentions: { parse: ['everyone'] }
    });

    await interaction.reply({
      content: 'Angel post announcement sent.',
      ephemeral: true
    });
  }
};