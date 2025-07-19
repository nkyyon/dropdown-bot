import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { CharacterManagerSheets } from '../utils/characterManagerSheets';
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
  const characterManager = CharacterManagerSheets.getInstance();

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
  characterManager: CharacterManagerSheets
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

    // ボタン方式でページ表示（最初のページを表示）
    await showCharacterButtonPage(interaction, characters, 0, 'reply');
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
  characterManager: CharacterManagerSheets
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
  characterManager: CharacterManagerSheets
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
  characterManager: CharacterManagerSheets
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
  characterManager: CharacterManagerSheets
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

export async function handleCharacterPageSelect(interaction: StringSelectMenuInteraction) {
  try {
    const selectedPage = interaction.values[0];
    const pageNumber = parseInt(selectedPage.replace('page_', ''));
    
    const characterManager = CharacterManagerSheets.getInstance();
    const characters = await characterManager.getCharacters();
    
    const MAX_OPTIONS = 25;
    const startIndex = pageNumber * MAX_OPTIONS;
    const endIndex = Math.min(startIndex + MAX_OPTIONS, characters.length);
    const pageCharacters = characters.slice(startIndex, endIndex);

    const options = pageCharacters.map(character =>
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

    const totalPages = Math.ceil(characters.length / MAX_OPTIONS);
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`🎮 キャラクター選択 - ページ ${pageNumber + 1}/${totalPages}`)
      .setDescription(`以下のドロップダウンメニューからキャラクターを選択してください\n\n**範囲:** ${startIndex + 1} - ${endIndex} 番目`)
      .setFooter({ text: `このページ: ${pageCharacters.length}文字 | 総数: ${characters.length}文字` });

    await interaction.update({
      embeds: [embed],
      components: [row],
    });

    console.log(`[INFO] Page ${pageNumber + 1} selected by ${interaction.user.username} (${pageCharacters.length} characters)`);
  } catch (error) {
    console.error('[ERROR] Failed to handle page selection:', error);
    await interaction.reply({
      content: '❌ ページ選択の処理に失敗しました',
      ephemeral: true,
    });
  }
}

async function showCharacterButtonPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  characters: string[],
  currentPage: number,
  responseType: 'reply' | 'update'
) {
  try {
    const CHARACTERS_PER_PAGE = 20; // ナビゲーションボタンのために20文字まで
    const totalPages = Math.ceil(characters.length / CHARACTERS_PER_PAGE);
    
    // 現在のページのキャラクター取得
    const startIndex = currentPage * CHARACTERS_PER_PAGE;
    const endIndex = Math.min(startIndex + CHARACTERS_PER_PAGE, characters.length);
    const pageCharacters = characters.slice(startIndex, endIndex);

    // キャラクターボタンを5行に分割（各行最大5ボタン）
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    
    for (let i = 0; i < pageCharacters.length; i += 5) {
      const rowCharacters = pageCharacters.slice(i, i + 5);
      const row = new ActionRowBuilder<ButtonBuilder>();
      
      rowCharacters.forEach(character => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`char_${character}`)
            .setLabel(character)
            .setStyle(ButtonStyle.Primary)
        );
      });
      
      rows.push(row);
    }

    // ナビゲーションボタン行
    const navRow = new ActionRowBuilder<ButtonBuilder>();
    
    // 前ページボタン
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_${currentPage}`)
        .setLabel('⬅️ 前')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0)
    );

    // ページ番号ボタン（現在のページ周辺のみ表示）
    const maxPageButtons = 3;
    let startPage = Math.max(0, currentPage - 1);
    let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 1);
    
    // 調整：右端の場合
    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(0, endPage - maxPageButtons + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`page_${page}`)
          .setLabel((page + 1).toString())
          .setStyle(page === currentPage ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(page === currentPage)
      );
    }

    // 次ページボタン
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`next_${currentPage}`)
        .setLabel('➡️ 次')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1)
    );

    rows.push(navRow);

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`🎮 キャラクター選択 - ページ ${currentPage + 1}/${totalPages}`)
      .setDescription(`キャラクターを選択してください\n\n**表示範囲:** ${startIndex + 1} - ${endIndex} 番目`)
      .setFooter({ text: `このページ: ${pageCharacters.length}文字 | 総数: ${characters.length}文字` });

    const payload = {
      embeds: [embed],
      components: rows,
    };

    if (responseType === 'reply') {
      await interaction.reply(payload);
    } else {
      // ButtonInteractionのみupdateメソッドを持つ
      if ('update' in interaction) {
        await interaction.update(payload);
      } else {
        await interaction.reply(payload);
      }
    }

  } catch (error) {
    console.error('[ERROR] Failed to show character button page:', error);
    const errorMessage = '❌ キャラクター選択画面の表示に失敗しました';
    
    if (responseType === 'reply') {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    }
  }
}

export async function handleCharacterButtonInteraction(interaction: ButtonInteraction) {
  try {
    const customId = interaction.customId;
    
    if (customId.startsWith('char_')) {
      // キャラクター選択
      const selectedCharacter = customId.replace('char_', '');
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
      
    } else if (customId.startsWith('prev_') || customId.startsWith('next_') || customId.startsWith('page_')) {
      // ページナビゲーション
      const characterManager = CharacterManagerSheets.getInstance();
      const characters = await characterManager.getCharacters();
      
      let newPage = 0;
      
      if (customId.startsWith('prev_')) {
        const currentPage = parseInt(customId.replace('prev_', ''));
        newPage = Math.max(0, currentPage - 1);
      } else if (customId.startsWith('next_')) {
        const currentPage = parseInt(customId.replace('next_', ''));
        const totalPages = Math.ceil(characters.length / 20);
        newPage = Math.min(totalPages - 1, currentPage + 1);
      } else if (customId.startsWith('page_')) {
        newPage = parseInt(customId.replace('page_', ''));
      }
      
      await showCharacterButtonPage(interaction, characters, newPage, 'update');
    }
    
  } catch (error) {
    console.error('[ERROR] Failed to handle character button interaction:', error);
    await interaction.reply({
      content: '❌ ボタン操作の処理に失敗しました',
      ephemeral: true,
    });
  }
}