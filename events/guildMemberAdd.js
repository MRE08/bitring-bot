const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {

    const channelId = '1476993922734624981';
    const announcementChannelId = '1347168699098071040';
    const officiallinkchannelId = '1347172051584155678';

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const message = await channel.send(
      `Welcome to BitRing ${member} 👋\n` +
      `Make sure to check out <#${announcementChannelId}> and <#${officiallinkchannelId}>.`
    );

    // ⏱️ Delete after 15 seconds
    setTimeout(() => {
      message.delete().catch(() => {});
    }, 30000);
  },
};