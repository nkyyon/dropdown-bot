import { Client } from 'discord.js';
import { CharacterManager } from '../utils/characterManager';

export async function handleReady(client: Client) {
  console.log('[INFO] Bot started successfully');
  console.log(`[INFO] Logged in as ${client.user?.tag}`);
  console.log(`[INFO] Serving ${client.guilds.cache.size} guild(s)`);

  try {
    const characterManager = CharacterManager.getInstance();
    const characters = await characterManager.getCharacters();
    console.log(`[INFO] Loaded ${characters.length} characters`);
  } catch (error) {
    console.error('[ERROR] Failed to load initial character data:', error);
  }

  client.user?.setActivity('キャラクター選択', { type: 0 });
}