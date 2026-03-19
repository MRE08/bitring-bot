const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fetch = require('node-fetch');

const ALLOWED_CHANNEL_ID = '1484047680714965083';

const ALLOWED_ROLE_IDS = [
  '1477915085396512878',
  '1482822996732280882',
  '1482823757281366206'
];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCaption(style) {
  const captions = {
    hype: [
      'New BitRing Angel drop just landed 🚀👇',
      'Fresh content just dropped 🔥 Tap in 👇',
      'This one is too good to miss 👇',
      'Big BitRing Angel content just went live 👇'
    ],
    curiosity: [
      'Most people are still sleeping on this 👇',
      'You need to see this 👇',
      'This is where things get interesting 👇',
      'Watch this and you will get it 👇'
    ],
    educational: [
      'Quick breakdown you should watch 👇',
      'This explains BitRing clearly 👇',
      'Useful insight for anyone getting started 👇',
      'Watch this for a better understanding 👇'
    ],
    fitness: [
      'Train. Track. Earn. Watch this 👇',
      'Fitness meets Web3 👇',
      'This is how BitRing connects movement and rewards 👇',
      'If you are into fitness, check this out 👇'
    ],
    default: [
      'Check out the new BitRing Angel post 👇'
    ]
  };

  return random(captions[style] || captions.default);
}

function generatePingMessage() {
  return random([
    '@everyone 🚨 New BitRing Angel drop!',
    '@everyone 🔥 Fresh content just dropped!',
    '@everyone 🚀 New influencer content is live!',
    '@everyone 👀 You do not want to miss this!'
  ]);
}

function isTikTokLink(link) {
  return /tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/i.test(link);
}

async function resolveTikTokLink(url) {
  if (!/vt\.tiktok\.com|vm\.tiktok\.com/i.test(url)) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    return response.url || url;
  } catch (error) {
    console.error('Failed to resolve TikTok short link:', error);
    return url;
  }
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
        .setName('style')
        .setDescription('Choose caption style')
        .setRequired(true)
        .addChoices(
          { name: 'Hype', value: 'hype' },
          { name: 'Curiosity', value: 'curiosity' },
          { name: 'Educational', value: 'educational' },
          { name: 'Fitness', value: 'fitness' }
        )
    )
    .addStringOption(option =>
      option
        .setName('caption')
        .setDescription('Optional custom caption. Leave empty for auto caption')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
        return interaction.reply({
          content: `Use this command in <#${ALLOWED_CHANNEL_ID}>.`,
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      const hasRole = member.roles.cache.some(role =>
        ALLOWED_ROLE_IDS.includes(role.id)
      );

      if (!hasRole) {
        return interaction.reply({
          content: 'You do not have permission to use this command.',
          ephemeral: true
        });
      }

      let link = interaction.options.getString('link');
      const style = interaction.options.getString('style');
      const captionInput = interaction.options.getString('caption');

      if (isTikTokLink(link)) {
        link = await resolveTikTokLink(link);
      }

      const finalCaption = captionInput || generateCaption(style);
      const pingMessage = generatePingMessage();
      const tiktok = isTikTokLink(link);

      const embed = new EmbedBuilder()
        .setColor('#00b0f4')
        .setTitle(tiktok ? '🎥 BitRing TikTok Drop' : '🚀 BitRing Angel Drop')
        .setDescription(finalCaption)
        .addFields(
          { name: 'Style', value: style, inline: true },
          { name: 'Posted by', value: interaction.user.username, inline: true }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(tiktok ? 'Watch Now' : 'Open Post')
          .setStyle(ButtonStyle.Link)
          .setURL(link)
      );

      await interaction.channel.send({
        content: `${pingMessage}\n${link}`,
        embeds: [embed],
        components: [row],
        allowedMentions: { parse: ['everyone'] }
      });

      await interaction.reply({
        content: 'Posted successfully.',
        ephemeral: true
      });
    } catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Something went wrong. Check logs.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Something went wrong. Check logs.',
          ephemeral: true
        });
      }
    }
  }
};