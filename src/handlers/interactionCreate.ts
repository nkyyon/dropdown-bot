import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { handleCharacterSelect, handleCharacterPageSelect, handleCharacterButtonInteraction } from '../commands/character';

export async function handleInteractionCreate(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.find(cmd => cmd.data.name === interaction.commandName);
      
      if (!command) {
        console.error(`[ERROR] Unknown command: ${interaction.commandName}`);
        return;
      }

      await command.execute(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'character_select') {
        await handleCharacterSelect(interaction);
      } else if (interaction.customId === 'character_page_select') {
        await handleCharacterPageSelect(interaction);
      }
    } else if (interaction.isButton()) {
      const customId = interaction.customId;
      if (customId.startsWith('char_') || customId.startsWith('prev_') || 
          customId.startsWith('next_') || customId.startsWith('page_')) {
        await handleCharacterButtonInteraction(interaction);
      }
    }
  } catch (error) {
    console.error('[ERROR] Error handling interaction:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    try {
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: `❌ エラー: ${errorMessage}`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `❌ エラー: ${errorMessage}`,
            ephemeral: true,
          });
        }
      }
    } catch (replyError) {
      console.error('[ERROR] Failed to send error message:', replyError);
    }
  }
}