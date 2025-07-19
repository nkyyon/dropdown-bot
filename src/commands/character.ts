import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from 'discord.js';
import { CharacterManagerDB } from '../utils/characterManagerDB';
import { checkAdminPermission } from '../utils/permissions';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('キャラクター管理・選択')
  .addSubcommand(subcommand =>
    subcommand
      .setName('select')
      .setDescription('キャラクターを選択します')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('キャラクターを追加します（管理者のみ）')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('追加するキャラクター名')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('キャラクターを削除します（管理者のみ）')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('削除するキャラクター名')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('現在のキャラクターリストを表示します（管理者のみ）')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('Bot情報を表示します（管理者のみ）')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const characterManager = CharacterManagerDB.getInstance();

  switch (subcommand) {
    case 'select':
      await handleSelectCommand(interaction, characterManager);
      break;
    case 'add':
      await handleAddCommand(interaction, characterManager);
      break;
    case 'remove':
      await handleRemoveCommand(interaction, characterManager);
      break;
    case 'list':
      await handleListCommand(interaction, characterManager);
      break;
    case 'info':
      await handleInfoCommand(interaction, characterManager);
      break;
  }
}

async function handleSelectCommand(
  interaction: ChatInputCommandInteraction,
  characterManager: CharacterManagerDB
) {
  try {
    const characters = await characterManager.getCharacters();
    
    if (characters.length === 0) {
      await interaction.reply({
        content: '❌ キャラクターリストが空です。管理者にお問い合わせください。',
        ephemeral: true,
      });
      return;
    }

    const options = characters.map(character =>
      new StringSelectMenuOptionBuilder()
        .setLabel(character)
        .setValue(character)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('character_select')
      .setPlaceholder('キャラクターを選択してください')
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🎮 キャラクター選択')
      .setDescription('以下のドロップダウンメニューからキャラクターを選択してください')
      .setFooter({ text: `利用可能キャラクター: ${characters.length}体` });

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });
  } catch (error) {
    console.error('[ERROR] Failed to handle select command:', error);
    await interaction.reply({
      content: '❌ キャラクター選択メニューの表示に失敗しました',
      ephemeral: true,
    });
  }
}

async function handleAddCommand(
  interaction: ChatInputCommandInteraction,
  characterManager: CharacterManagerDB
) {
  try {
    if (!interaction.member || !interaction.guild) {
      await interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます',
        ephemeral: true,
      });
      return;
    }

    checkAdminPermission(interaction.member as any);

    const name = interaction.options.getString('name', true);
    await characterManager.addCharacter(name);

    await interaction.reply({
      content: `✅ キャラクター「**${name}**」を追加しました`,
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    await interaction.reply({
      content: `❌ ${errorMessage}`,
      ephemeral: true,
    });
  }
}

async function handleRemoveCommand(
  interaction: ChatInputCommandInteraction,
  characterManager: CharacterManagerDB
) {
  try {
    if (!interaction.member || !interaction.guild) {
      await interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます',
        ephemeral: true,
      });
      return;
    }

    checkAdminPermission(interaction.member as any);

    const name = interaction.options.getString('name', true);
    await characterManager.removeCharacter(name);

    await interaction.reply({
      content: `✅ キャラクター「**${name}**」を削除しました`,
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    await interaction.reply({
      content: `❌ ${errorMessage}`,
      ephemeral: true,
    });
  }
}

async function handleListCommand(
  interaction: ChatInputCommandInteraction,
  characterManager: CharacterManagerDB
) {
  try {
    if (!interaction.member || !interaction.guild) {
      await interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます',
        ephemeral: true,
      });
      return;
    }

    checkAdminPermission(interaction.member as any);

    const characters = await characterManager.getCharacters();
    const metadata = await characterManager.getMetadata();

    if (characters.length === 0) {
      await interaction.reply({
        content: '📝 **現在のキャラクターリスト**\n\n（空）',
        ephemeral: true,
      });
      return;
    }

    const characterList = characters
      .map((character, index) => `${index + 1}. ${character}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('📝 現在のキャラクターリスト')
      .setDescription(characterList)
      .addFields([
        { name: 'キャラクター数', value: `${characters.length}/${metadata.maxCharacters}`, inline: true },
        { name: '最終更新', value: new Date(metadata.lastUpdated).toLocaleString('ja-JP'), inline: true },
      ]);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    await interaction.reply({
      content: `❌ ${errorMessage}`,
      ephemeral: true,
    });
  }
}

async function handleInfoCommand(
  interaction: ChatInputCommandInteraction,
  characterManager: CharacterManagerDB
) {
  try {
    if (!interaction.member || !interaction.guild) {
      await interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます',
        ephemeral: true,
      });
      return;
    }

    checkAdminPermission(interaction.member as any);

    const characterCount = await characterManager.getCharacterCount();
    const metadata = await characterManager.getMetadata();
    const uptime = process.uptime();
    
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
      .setColor(0xFF9900)
      .setTitle('🤖 Bot情報')
      .addFields([
        { name: 'バージョン', value: metadata.version, inline: true },
        { name: 'キャラクター数', value: `${characterCount}体`, inline: true },
        { name: '最終更新', value: new Date(metadata.lastUpdated).toLocaleString('ja-JP'), inline: true },
        { name: '稼働時間', value: `${hours}時間 ${minutes}分 ${seconds}秒`, inline: false },
      ])
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    await interaction.reply({
      content: `❌ ${errorMessage}`,
      ephemeral: true,
    });
  }
}

export async function handleCharacterSelect(interaction: StringSelectMenuInteraction) {
  try {
    const selectedCharacter = interaction.values[0];
    const user = interaction.user;

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ キャラクター選択完了')
      .setDescription(`${user} が **${selectedCharacter}** を選択しました`)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });

    console.log(`[INFO] Character selected: ${selectedCharacter} by ${user.username} (${user.id})`);
  } catch (error) {
    console.error('[ERROR] Failed to handle character selection:', error);
    await interaction.reply({
      content: '❌ キャラクター選択の処理に失敗しました',
      ephemeral: true,
    });
  }
}