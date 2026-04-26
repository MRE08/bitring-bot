const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ALLOWED_ROLE_IDS = [
  '1477915085396512878',
  '1482822996732280882',
  '1482823757281366206'
];

const LOG_CHANNEL_ID = '1487011713164509194';
const GM_CHANNEL_ID = '1347177401930743910';

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

function ensureFile() {
  const dir = path.dirname(OFFENDER_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(OFFENDER_FILE)) {
    fs.writeFileSync(OFFENDER_FILE, JSON.stringify({}, null, 2));
  }
}

function loadData() {
  try {
    ensureFile();
    return JSON.parse(fs.readFileSync(OFFENDER_FILE, 'utf8'));
  } catch (err) {
    console.error('Load error:', err);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(OFFENDER_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Save error:', err);
  }
}

function increment(userId) {
  const data = loadData();

  if (!data[userId]) {
    data[userId] = { count: 0 };
  }

  data[userId].count += 1;

  saveData(data);

  return data[userId].count;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;
      if (!message.guild) return;
          const hasAdmin = message.member?.permissions.has(
        PermissionFlagsBits.Administrator
      );

      const hasRole = message.member?.roles?.cache?.some(role =>
        ALLOWED_ROLE_IDS.includes(role.id)
      );

      // 🚫 BLOCK @everyone / @here
      if (
        !hasAdmin &&
        !hasRole &&
        (message.mentions.everyone || message.content.includes('@here'))
      ) {
        console.log(`Everyone/here mention detected from ${message.author.tag}`);

        const deleted = await message.delete().then(() => true).catch(err => {
          console.error('❌ DELETE FAILED (@everyone/@here):', err);
          return false;
        });

        let warningText = `${message.author} you are not allowed to tag everyone or here.`;

        if (!deleted) {
          warningText = `${message.author} you are not allowed to tag everyone or here, but I could not delete your message. Check my permissions.`;
        }

        const warn = await message.channel.send(warningText).catch(err => {
          console.error('❌ WARNING SEND FAILED (@everyone/@here):', err);
          return null;
        });

        if (warn) {
          setTimeout(() => warn.delete().catch(() => {}), 5000);
        }

        return;
      }

      // 🚨 LINK MODERATION
      if (!hasAdmin && !hasRole && containsLink(message.content)) {
    
        const original = message.content;
        const member = message.member;

        const count = increment(message.author.id);

        console.log(`Link detected from ${message.author.tag} | Count: ${count}`);

        // 🔴 DELETE MESSAGE (WITH DEBUG)
        const deleted = await message.delete().then(() => true).catch(err => {
          console.error('❌ DELETE FAILED:', err);
          return false;
        });

        // ⚠️ WARNING MESSAGE
        let warningText = `${message.author} you are not allowed to send links here.`;

        if (count === 2) {
          warningText = `${message.author} this is your second warning. Stop sending links.`;
        }

        if (count >= 3) {
          warningText = `${message.author} repeated violations detected. Action taken.`;
        }

        const warn = await message.channel.send(warningText).catch(err => {
          console.error('❌ WARNING SEND FAILED:', err);
          return null;
        });

        if (warn) {
          setTimeout(() => warn.delete().catch(() => {}), 8000);
        }

        // ⛔ TIMEOUT
        let timeoutApplied = false;

        if (count >= 3) {
          if (member?.moderatable) {
            try {
              await member.timeout(10 * 60 * 1000, 'Spam links');
              timeoutApplied = true;
            } catch (err) {
              console.error('❌ TIMEOUT FAILED:', err);
            }
          } else {
            console.log('⚠️ USER NOT MODERATABLE (CHECK ROLE POSITION)');
          }
        }

        // 📊 LOGGING (WITH DEBUG)
        let logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!logChannel) {
          logChannel = await message.guild.channels.fetch(LOG_CHANNEL_ID).catch(err => {
            console.error('❌ FETCH LOG CHANNEL FAILED:', err);
            return null;
          });
        }

        if (!logChannel) {
          console.error(`❌ LOG CHANNEL NOT FOUND: ${LOG_CHANNEL_ID}`);
        } else {
          console.log('✅ LOG CHANNEL FOUND');

          const embed = new EmbedBuilder()
            .setColor(count >= 3 ? '#ff0000' : '#ffaa00')
            .setTitle('🚨 Link Violation')
            .addFields(
              { name: 'User', value: message.author.tag },
              { name: 'User ID', value: message.author.id },
              { name: 'Channel', value: `<#${message.channelId}>` },
              { name: 'Attempts', value: String(count), inline: true },
              { name: 'Deleted', value: deleted ? 'Yes' : 'No', inline: true },
              { name: 'Timeout', value: timeoutApplied ? 'Yes' : 'No', inline: true },
              { name: 'Message', value: original.slice(0, 1024) || 'No content' }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] }).catch(err => {
            console.error('❌ LOG SEND FAILED:', err);
          });
        }

        return;
      }

      // 🌅 GM AUTO REPLY SYSTEM
if (message.channelId === GM_CHANNEL_ID) {
  const text = message.content.toLowerCase().trim();

  if (text === 'gm' || text.startsWith('gm ')) {

    const replies = [
      `gm ${message.author} 🌅`,
      `good morning ${message.author} ☀️`,
      `gm legend ${message.author} 🚀`,
      `rise and grind ${message.author} 💪`,
      `gm king ${message.author} 👑`,
      `gm soldier ${message.author} 🫡`,
      `gm fam ${message.author} 🔥`,
      `another day, another win ${message.author} 💰`
    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    await message.reply(randomReply).catch(err => {
      console.error('❌ GM REPLY FAILED:', err);
    });

    return;
  }
}

      // 💬 AUTO REPLIES
      const text = message.content.toLowerCase();

      if (text.includes('whitepaper')) {
        return message.reply('Here is the whitepaper: https://www.bitring.xyz/brt-protocol');
      }

      if (text.includes('docs')) {
        return message.reply('Here are the docs: https://www.bitring.xyz/brt-protocol');
      }

      if (text.includes('website')) {
        return message.reply('Here is the website: https://www.bitring.xyz');
      }

      if (text.includes('twitter') || text.includes('x account')) {
        return message.reply('Here is the X account: https://x.com/bitring2025');
      }

    } catch (err) {
      console.error('❌ GLOBAL ERROR:', err);
    }
  },
};