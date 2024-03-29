import { MessageEmbed } from 'discord.js';

const inProgressMedia = ['https://cdn.discordapp.com/attachments/939806800679690260/946066357114503238/FULL.png'];

const missingPlayersMedia: { [key: number]: string } = {
  1: 'https://cdn.discordapp.com/attachments/939806800679690260/947890426449383424/1.png',
  2: 'https://cdn.discordapp.com/attachments/939806800679690260/947890426898178068/2.png',
  3: 'https://cdn.discordapp.com/attachments/939806800679690260/947890427195953202/3.png',
};

export type Author = {
  id: string;
  avatar: string | null;
};

type Channel = {
  id?: string;
  name?: string;
};

export type LfsUsers =
  | {
      discordId: string | null;
    }[]
  | undefined;

export type LfsEmbedProps = {
  author?: Author;
  inviteUrl?: string | null;
  note?: string;
  channel?: any | null;
  users: LfsUsers;
  missingPlayers?: number;
  footer?: string;
};

export const LfsMessage = ({ author, channel, inviteUrl, users, note, footer, missingPlayers }: LfsEmbedProps) => {
  const usersList = users?.map((user) => {
    return `\n<@${user.discordId}>`;
  });
  console.log('missingPlayers', missingPlayers);
  console.log('missingPlayers', typeof missingPlayers);

  const calculateImage = (missingPlayers: number) => {
    if (missingPlayers < 0) {
      return 'https://cdn.discordapp.com/attachments/939806800679690260/945611614244208650/GOTOP.png';
    }

    if (missingPlayers <= 3) {
      return missingPlayersMedia[missingPlayers];
    }

    return 'https://cdn.discordapp.com/attachments/939806800679690260/945611614244208650/GOTOP.png';
  };

  const thumbnail =
    missingPlayers && missingPlayers != 0
      ? calculateImage(missingPlayers)
      : inProgressMedia[Math.floor(Math.random() * inProgressMedia.length)];

  const computeAuthorAvatar = (channel: Channel | null, author?: Author) => {
    if (author && author.id) {
      return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=128&channelId=${
        channel?.id
      }&channelName=${encodeURIComponent(channel?.name ?? '')}`;
    }
  };

  const connectionUrl = inviteUrl
    ? `**Подключиться:** ${inviteUrl}`
    : `**Играют в канале:** **${channel?.name}**ㅤㅤㅤㅤㅤㅤㅤㅤ`;

  const Embed = new MessageEmbed()
    .setColor(users?.length === 4 ? '#FF0000' : '#00FF00') //цвет сообщения
    .setDescription(
      `
          
${usersList?.join('')}

${connectionUrl}
          
${note ? `> ${note}` : ''}
`,
    )
    .setFooter(footer)
    .setTimestamp()
    .setThumbnail(thumbnail)
    .setAuthor(channel?.name, computeAuthorAvatar(channel, author));

  return Embed;
};
