import fs from 'fs/promises';
import path from 'path';
import { CharacterData } from '../types';

// 本番環境とローカル環境の両方に対応
const CHARACTER_FILE_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'src/data/characters.json')
  : path.join(__dirname, '../data/characters.json');

// 本番環境では書き込み可能なディレクトリを使用
const WRITABLE_CHARACTER_FILE_PATH = process.env.NODE_ENV === 'production'
  ? '/tmp/characters.json'
  : CHARACTER_FILE_PATH;

export class CharacterManager {
  private static instance: CharacterManager;
  private charactersData: CharacterData | null = null;

  private constructor() {}

  public static getInstance(): CharacterManager {
    if (!CharacterManager.instance) {
      CharacterManager.instance = new CharacterManager();
    }
    return CharacterManager.instance;
  }

  async loadCharacters(): Promise<CharacterData> {
    try {
      // 本番環境では初回起動時にreadonly→tmpにコピー
      if (process.env.NODE_ENV === 'production') {
        try {
          // 既にtmpにファイルがあるかチェック
          await fs.access(WRITABLE_CHARACTER_FILE_PATH);
        } catch {
          // tmpにファイルがない場合、初期データをコピー
          const initialData = await fs.readFile(CHARACTER_FILE_PATH, 'utf-8');
          await fs.writeFile(WRITABLE_CHARACTER_FILE_PATH, initialData, 'utf-8');
          console.log('[INFO] Initial characters data copied to writable location');
        }
        
        const fileContent = await fs.readFile(WRITABLE_CHARACTER_FILE_PATH, 'utf-8');
        this.charactersData = JSON.parse(fileContent);
      } else {
        const fileContent = await fs.readFile(CHARACTER_FILE_PATH, 'utf-8');
        this.charactersData = JSON.parse(fileContent);
      }
      
      return this.charactersData!;
    } catch (error) {
      console.error('[ERROR] Failed to load characters.json:', error);
      throw new Error('キャラクターデータの読み込みに失敗しました');
    }
  }

  async saveCharacters(data: CharacterData): Promise<void> {
    try {
      data.metadata.lastUpdated = new Date().toISOString();
      const jsonContent = JSON.stringify(data, null, 2);
      
      // 本番環境では書き込み可能な場所に保存
      const filePath = process.env.NODE_ENV === 'production' 
        ? WRITABLE_CHARACTER_FILE_PATH 
        : CHARACTER_FILE_PATH;
        
      await fs.writeFile(filePath, jsonContent, 'utf-8');
      this.charactersData = data;
      console.log('[INFO] Characters data saved successfully');
      
      if (process.env.NODE_ENV === 'production') {
        console.log('[WARN] Changes saved to temporary storage - will be lost on restart');
      }
    } catch (error) {
      console.error('[ERROR] Failed to save characters.json:', error);
      throw new Error('キャラクターデータの保存に失敗しました');
    }
  }

  async getCharacters(): Promise<string[]> {
    if (!this.charactersData) {
      await this.loadCharacters();
    }
    return this.charactersData!.characters;
  }

  async addCharacter(name: string): Promise<void> {
    const data = this.charactersData || await this.loadCharacters();
    
    if (data.characters.includes(name)) {
      throw new Error(`キャラクター「${name}」は既に存在します`);
    }

    if (data.characters.length >= data.metadata.maxCharacters) {
      throw new Error(`キャラクター数が上限（${data.metadata.maxCharacters}）に達しています`);
    }

    data.characters.push(name);
    await this.saveCharacters(data);
    console.log(`[INFO] Character added: ${name}`);
  }

  async removeCharacter(name: string): Promise<void> {
    const data = this.charactersData || await this.loadCharacters();
    
    const index = data.characters.indexOf(name);
    if (index === -1) {
      throw new Error(`キャラクター「${name}」が見つかりません`);
    }

    data.characters.splice(index, 1);
    await this.saveCharacters(data);
    console.log(`[INFO] Character removed: ${name}`);
  }

  async getCharacterCount(): Promise<number> {
    const characters = await this.getCharacters();
    return characters.length;
  }

  async getMetadata(): Promise<CharacterData['metadata']> {
    const data = this.charactersData || await this.loadCharacters();
    return data.metadata;
  }
}