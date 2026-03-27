const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ALLOWED_ROLE_IDS = [
  '1477915085396512878',
  '1482822996732280882',
  '1482823757281366206'
];

const LOG_CHANNEL_ID = '1487011713164509194';

const OFFENDER_FILE = path.join(__dirname, '..', 'data', 'linkOffenders.json');

function containsLink(text) {
  const patterns = [
    /(https?:\/\/[^\s]+)/i,
    /(www\.[^\s]+)/i,
    /\b[a-z0-9-]+\.(com|org|net|xyz|io|gg|me|co|ai)\/\S*/i,
    /\b[a-z0-9-]+\.(com|org|net|xyz|io|gg|me|co|ai)\b/i,
    /(discord\.gg|discord\.com\/invite)/i,
    /(t\.me|telegram\.me)/i,
    /(vt\.tiktok\.com|vm\.tiktok\.com|tiktok\.com)/i,
    /(bit\.ly|tinyurl\.com|goo\.gl)/i
  ];

  return patterns.some(regex => regex.test(text));
}

function loadOffenders() {
  try {
    if (!fs.existsSync(OFFENDER_FILE)) {
      fs.writeFileSync(OFFENDER_FILE, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(OFFENDER_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to load offender file:', error);
    return {};
  }
}

function saveOffenders(data) {
  try {
    fs.writeFileSync(OFFENDER_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save offender file:', error);
  }
}

function getOffenseCount(userId) {
  const offenders = loadOffenders();
  return offenders[userId]?.count || 0;
}

function incrementOffense(userId) {
  const offenders = loadOffenders();

  if (!offenders[userId]) {
    offenders[userId] = { count: 0, lastUpdated: null };
  }

  offenders[userId].count += 1;
  offenders[userId].lastUpdated = new Date().toISOString();

  saveOffenders(offenders);

  return offenders[userId].count;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;
      if (!message.guild) return;

      const hasAdminPerm = message.member?.permissions.has(
        PermissionFlagsBits.Administrator
      );

      const hasAllowedRole = message.member?.roles?.cache?.some(role =>
        ALLOWED_ROLE_IDS.includes(role.id)
      );

      // ---------- LINK MODERATION ----------
      if (!hasAdminPerm && !hasAllowedRole && containsLink(message.content)) {
        const originalContent = message.content;
        const member = message.member;
        const offenseCount = incrementOffense(message.author.id);

        await message.delete().catch(console.error);

        let warningText = `${message.author} you are not allowed to send links here.`;

        if (offenseCount === 2) {
          warningText = `${message.author} this is your second warning. You are not allowed to send links here.`;
        }

        if (offenseCount >= 3) {
          warningText = `${message.author} you have repeatedly posted unauthorized links and have been flagged.`;
        }

        const warning = await message.channel.send(warningText).catch(() => null);

        if (warning) {
          setTimeout(() => {
            warning.delete().catch(() => {});
          }, 8000);
        }

        let timeoutApplied = false;

        if (offenseCount >= 3 && member?.moderatable) {
          try {
            await member.timeout(
              10 * 60 * 1000,
              'Repeated unauthorized link posting'
            );
            timeoutApplied = true;
          } catch (error) {
            console.error('Failed to timeout user:', error);
          }
        }

        const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(offenseCount >= 3 ? '#ff0000' : '#ff9900')
            .setTitle('Unauthorized Link Attempt')
            .addFields(
              { name: 'User', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Channel', value: `<#${message.channelId}>` },
              { name: 'Attempt Count', value: String(offenseCount), inline: true },
              {
                name: 'Timeout Applied',
                value: timeoutApplied ? 'Yes, 10 minutes' : 'No',
                inline: true
              },
              {
                name: 'Message Content',
                value: originalContent.slice(0, 1024) || 'No content'
              }
            )
            .setTimestamp()
            .setFooter({ text: 'BitRing Moderation Log' });

          await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }

        return;
      }

      // ---------- AUTO REPLIES ----------
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
    } catch (error) {
      console.error('messageCreate error:', error);
    }
  },
};