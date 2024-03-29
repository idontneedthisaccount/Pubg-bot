import argv from 'yargs-parser';
import { Client, Message } from 'discord.js';
import { EmbedErrorMessage } from '../../embeds/Error';
import { parseAuthorIdFromLfsEmbed } from '../../utils/embeds';
import { logError } from '../../services/logs';
import LfsResolver from './invite';
import LinkResolver from './reg';
import UnlinkResolver from './unlink';
import UpdateResolver from './update';
import StatResolver from './stat';
import MapResolver from './map'
import AntiSpam from '../../services/spam';

export type CommandResolver = (client: Client, message: Message, argumentsParsed: argv.Arguments) => Promise<void>;

type Resolvers = {
  [key: string]: CommandResolver;
};

export const NOTE_LIMIT_CHARS = 120;
export const QUOTE_REGEX = /^"(.*?)"$/;

export const resolvers: Resolvers = {
  '!invite': LfsResolver,
  '!drop': MapResolver,
  '!i': LfsResolver,
  '!reg': LinkResolver,
  '!unreg': UnlinkResolver,
  '!update': UpdateResolver,
  '!stat': StatResolver,
  '!del': async (client, message) => {
    if (message.channel.id !== process.env.LFS_CHANNEL_ID) return;

    await message.delete();
    const channel = await client.channels.fetch(process.env.LFS_CHANNEL_ID);
    if (channel.isText()) {
      const messages = await channel.messages.fetch();
      // find last embed initiated by the author and delete
      const authorEmbedsMessages = messages.filter(
        (m) => m.author.bot && m.embeds.length > 0 && parseAuthorIdFromLfsEmbed(m.embeds[0]) === message.author.id,
      );
      console.log({ authorEmbedsMessages });
      const firstAuthorEmbedMessage = authorEmbedsMessages.first();
      await firstAuthorEmbedMessage?.delete();
    }
  },
};

export const COMMANDS = Object.keys(resolvers);

export const commandsResolver = async (client: Client, message: Message) => {
  const isAdminChannel = message.channel.id === process.env.ADMIN_CHANNEL_ID;
  const commandArgv = argv(message.content);

  const [command] = commandArgv._;

  if (!COMMANDS.includes(command?.toLowerCase().trim())) return null;

  try {
    AntiSpam.log(message.author.id, message.content);
    const isSpamDetected = await AntiSpam.checkMessageInterval(message); // Check sent messages interval
    if (isSpamDetected) {
      await message.delete();
      await message.author.send(`<@${message.author.id}>, пожалуйста - не спамьте.`);
      throw new Error(`Обнаружен спам ${message.content} от <@${message.author.id}>`);
    }

    const resolver = resolvers[command];
    await resolver(client, message, commandArgv);
  } catch (err: any) {
    if (err.name === 'EmbedError' || isAdminChannel) {
      await message.channel.send(EmbedErrorMessage(err.message));
    } else console.error(`Error running command resolver: "${command}"`, err.message);

    await logError(client, message.channel.id, err);
  }
};
