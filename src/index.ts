import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { commands } from './commands';
import { handleInteractionCreate } from './handlers/interactionCreate';
import { handleReady } from './handlers/ready';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log('[INFO] Started refreshing application (/) commands.');

    const commandData = commands.map(command => command.data.toJSON());

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commandData }
      );
      console.log('[INFO] Successfully reloaded guild application (/) commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commandData }
      );
      console.log('[INFO] Successfully reloaded global application (/) commands.');
    }
  } catch (error) {
    console.error('[ERROR] Failed to deploy commands:', error);
  }
}

client.once('ready', async () => {
  await handleReady(client);
  await deployCommands();
});

client.on('interactionCreate', handleInteractionCreate);

process.on('SIGINT', () => {
  console.log('[INFO] Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('[ERROR] Unhandled promise rejection:', error);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('[ERROR] DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('[ERROR] CLIENT_ID environment variable is required');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);