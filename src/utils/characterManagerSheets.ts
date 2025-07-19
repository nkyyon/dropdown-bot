import { GoogleSheetsConnection } from '../sheets/connection';
import { CharacterData } from '../types';

export class CharacterManagerSheets {
  private static instance: CharacterManagerSheets;
  private sheets: GoogleSheetsConnection;

  // スプレッドシートの範囲定義
  private readonly CHARACTERS_RANGE = 'Characters!A:B'; // A: ID, B: Name
  private readonly CHARACTERS_DATA_RANGE = 'Characters!B:B'; // Name列のみ

  private constructor() {
    this.sheets = GoogleSheetsConnection.getInstance();
  }

  public static getInstance(): CharacterManagerSheets {
    if (!CharacterManagerSheets.instance) {
      CharacterManagerSheets.instance = new CharacterManagerSheets();
    }
    return CharacterManagerSheets.instance;
  }

  async initialize(): Promise<void> {
    try {
      // 接続テスト
      const isConnected = await this.sheets.testConnection();
      if (!isConnected) {
        throw new Error('Google Sheets connection failed');
      }

      // シートの初期化確認
      await this.ensureCharacterSheetExists();
      console.log('[INFO] CharacterManagerSheets initialized successfully');
    } catch (error) {
      console.error('[ERROR] Failed to initialize CharacterManagerSheets:', error);
      throw error;
    }
  }

  private async ensureCharacterSheetExists(): Promise<void> {
    try {
      // キャラクターシートの存在確認と初期化
      const characterValues = await this.sheets.readRange(this.CHARACTERS_RANGE);
      if (characterValues.length === 0) {
        // ヘッダーとデフォルトキャラクターを設定
        const defaultCharacters = [
          ['ID', 'Name'],
          ['1', '春麗'],
          ['2', 'リュウ'],
          ['3', 'ケン'],
          ['4', 'ザンギエフ']
        ];
        await this.sheets.writeRange(this.CHARACTERS_RANGE, defaultCharacters);
        console.log('[INFO] Initialized characters sheet');
      }
    } catch (error) {
      console.error('[ERROR] Failed to ensure character sheet exists:', error);
      throw error;
    }
  }

  async getCharacters(): Promise<string[]> {
    try {
      const values = await this.sheets.readRange(this.CHARACTERS_DATA_RANGE);
      
      // ヘッダー行をスキップして、キャラクター名のみを取得
      const characters = values.slice(1)
        .map(row => row[0])
        .filter(name => name && name.trim() !== '');
      
      return characters;
    } catch (error) {
      console.error('[ERROR] Failed to get characters:', error);
      throw new Error('キャラクターデータの取得に失敗しました');
    }
  }

  async addCharacter(name: string): Promise<void> {
    try {
      // 既存キャラクターの確認
      const existingCharacters = await this.getCharacters();
      if (existingCharacters.includes(name)) {
        throw new Error(`キャラクター「${name}」は既に存在します`);
      }

      // 文字数制限確認
      const maxCharacters = 25; // 固定値
      if (existingCharacters.length >= maxCharacters) {
        throw new Error(`キャラクター数が上限（${maxCharacters}）に達しています`);
      }

      // 新しいIDを取得
      const allValues = await this.sheets.readRange(this.CHARACTERS_RANGE);
      const newId = allValues.length; // ヘッダー込みの行数がそのまま新ID

      // 新しい行を追加
      const newRow = [
        [newId.toString(), name]
      ];
      await this.sheets.appendRows('Characters!A:B', newRow);
      
      console.log(`[INFO] Character added to spreadsheet: ${name}`);
    } catch (error) {
      console.error('[ERROR] Failed to add character:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('キャラクターの追加に失敗しました');
    }
  }

  async removeCharacter(name: string): Promise<void> {
    try {
      const allValues = await this.sheets.readRange(this.CHARACTERS_RANGE);
      
      // 該当行を探す（ヘッダーを除く）
      let targetRowIndex = -1;
      for (let i = 1; i < allValues.length; i++) {
        if (allValues[i][1] === name) {
          targetRowIndex = i;
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(`キャラクター「${name}」が見つかりません`);
      }

      // 該当行を削除（行全体をクリア）
      const rowRange = `Characters!A${targetRowIndex + 1}:B${targetRowIndex + 1}`;
      await this.sheets.clearRange(rowRange);

      // データを再配置（空行を削除）
      await this.compactCharacterSheet();
      
      console.log(`[INFO] Character removed from spreadsheet: ${name}`);
    } catch (error) {
      console.error('[ERROR] Failed to remove character:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('キャラクターの削除に失敗しました');
    }
  }

  private async compactCharacterSheet(): Promise<void> {
    try {
      const allValues = await this.sheets.readRange(this.CHARACTERS_RANGE);
      
      // ヘッダーと有効なデータ行のみを抽出
      const header = allValues[0];
      const validRows = allValues.slice(1).filter(row => row[1] && row[1].trim() !== '');
      
      // IDを再設定
      const reorderedData = [header];
      validRows.forEach((row, index) => {
        row[0] = (index + 1).toString(); // ID再設定
        reorderedData.push(row);
      });

      // シート全体をクリアして再書き込み
      await this.sheets.clearRange(this.CHARACTERS_RANGE);
      await this.sheets.writeRange(this.CHARACTERS_RANGE, reorderedData);
    } catch (error) {
      console.error('[ERROR] Failed to compact character sheet:', error);
    }
  }

  async getCharacterCount(): Promise<number> {
    try {
      const characters = await this.getCharacters();
      return characters.length;
    } catch (error) {
      console.error('[ERROR] Failed to get character count:', error);
      throw new Error('キャラクター数の取得に失敗しました');
    }
  }

  async getMetadata(): Promise<CharacterData['metadata']> {
    return {
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      maxCharacters: 25
    };
  }

  async getAllCharacterData(): Promise<CharacterData> {
    try {
      const characters = await this.getCharacters();
      const metadata = await this.getMetadata();
      
      return {
        characters,
        metadata
      };
    } catch (error) {
      console.error('[ERROR] Failed to get all character data:', error);
      throw new Error('キャラクターデータの取得に失敗しました');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.sheets.testConnection();
    } catch (error) {
      console.error('[ERROR] Google Sheets health check failed:', error);
      return false;
    }
  }
}