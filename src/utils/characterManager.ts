import fs from 'fs/promises';
import path from 'path';
import { CharacterData } from '../types';

const CHARACTER_FILE_PATH = path.join(__dirname, '../data/characters.json');

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
      const fileContent = await fs.readFile(CHARACTER_FILE_PATH, 'utf-8');
      this.charactersData = JSON.parse(fileContent);
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
      await fs.writeFile(CHARACTER_FILE_PATH, jsonContent, 'utf-8');
      this.charactersData = data;
      console.log('[INFO] Characters data saved successfully');
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