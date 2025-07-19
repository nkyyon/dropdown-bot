import { Client } from 'discord.js';
import { CharacterManagerSheets } from '../utils/characterManagerSheets';

export async function handleReady(client: Client) {
  console.log('[INFO] Bot started successfully');
  console.log(`[INFO] Logged in as ${client.user?.tag}`);
  console.log(`[INFO] Serving ${client.guilds.cache.size} guild(s)`);

  try {
    const characterManager = CharacterManagerSheets.getInstance();
    await characterManager.initialize();
    const characters = await characterManager.getCharacters();
    console.log(`[INFO] Loaded ${characters.length} characters from Google Sheets`);
  } catch (error) {
    console.error('[ERROR] Failed to initialize Google Sheets or load character data:', error);
  }

  client.user?.setActivity('キャラクター選択', { type: 0 });
}