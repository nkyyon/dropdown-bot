import DatabaseConnection from '../database/connection';
import { DatabaseMigrations } from '../database/migrations';
import { CharacterData } from '../types';

export class CharacterManagerDB {
  private static instance: CharacterManagerDB;
  private db: DatabaseConnection;
  private migrations: DatabaseMigrations;

  private constructor() {
    this.db = DatabaseConnection.getInstance();
    this.migrations = new DatabaseMigrations();
  }

  public static getInstance(): CharacterManagerDB {
    if (!CharacterManagerDB.instance) {
      CharacterManagerDB.instance = new CharacterManagerDB();
    }
    return CharacterManagerDB.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.migrations.checkAndMigrate();
      console.log('[INFO] CharacterManagerDB initialized successfully');
    } catch (error) {
      console.error('[ERROR] Failed to initialize CharacterManagerDB:', error);
      throw error;
    }
  }

  async getCharacters(): Promise<string[]> {
    try {
      const result = await this.db.query(
        'SELECT name FROM characters ORDER BY created_at ASC'
      );
      return result.rows.map((row: any) => row.name);
    } catch (error) {
      console.error('[ERROR] Failed to get characters:', error);
      throw new Error('キャラクターデータの取得に失敗しました');
    }
  }

  async addCharacter(name: string): Promise<void> {
    try {
      // Check if character already exists
      const existingCheck = await this.db.query(
        'SELECT id FROM characters WHERE name = $1',
        [name]
      );

      if (existingCheck.rows.length > 0) {
        throw new Error(`キャラクター「${name}」は既に存在します`);
      }

      // Check character limit
      const countResult = await this.db.query('SELECT COUNT(*) FROM characters');
      const currentCount = parseInt(countResult.rows[0].count);
      
      const maxResult = await this.db.query(
        'SELECT value FROM metadata WHERE key = $1',
        ['max_characters']
      );
      const maxCharacters = parseInt(maxResult.rows[0]?.value || '25');

      if (currentCount >= maxCharacters) {
        throw new Error(`キャラクター数が上限（${maxCharacters}）に達しています`);
      }

      // Add character
      await this.db.query(
        'INSERT INTO characters (name) VALUES ($1)',
        [name]
      );

      console.log(`[INFO] Character added to database: ${name}`);
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
      const result = await this.db.query(
        'DELETE FROM characters WHERE name = $1 RETURNING id',
        [name]
      );

      if (result.rows.length === 0) {
        throw new Error(`キャラクター「${name}」が見つかりません`);
      }

      console.log(`[INFO] Character removed from database: ${name}`);
    } catch (error) {
      console.error('[ERROR] Failed to remove character:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('キャラクターの削除に失敗しました');
    }
  }

  async getCharacterCount(): Promise<number> {
    try {
      const result = await this.db.query('SELECT COUNT(*) FROM characters');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[ERROR] Failed to get character count:', error);
      throw new Error('キャラクター数の取得に失敗しました');
    }
  }

  async getMetadata(): Promise<CharacterData['metadata']> {
    try {
      const result = await this.db.query(`
        SELECT key, value, updated_at 
        FROM metadata 
        WHERE key IN ('version', 'max_characters')
      `);

      const metadata: any = {
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        maxCharacters: 25
      };

      result.rows.forEach((row: any) => {
        switch (row.key) {
          case 'version':
            metadata.version = row.value;
            break;
          case 'max_characters':
            metadata.maxCharacters = parseInt(row.value);
            break;
        }
        // Use the most recent update time
        if (new Date(row.updated_at) > new Date(metadata.lastUpdated)) {
          metadata.lastUpdated = row.updated_at;
        }
      });

      return metadata;
    } catch (error) {
      console.error('[ERROR] Failed to get metadata:', error);
      throw new Error('メタデータの取得に失敗しました');
    }
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
      return await this.db.testConnection();
    } catch (error) {
      console.error('[ERROR] Database health check failed:', error);
      return false;
    }
  }
}