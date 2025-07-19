export interface CharacterData {
  characters: string[];
  metadata: {
    lastUpdated: string;
    version: string;
    maxCharacters: number;
  };
}

export interface CharacterSelectInteraction {
  customId: 'character_select';
  values: string[];
  user: {
    id: string;
    username: string;
  };
  guild: {
    id: string;
    name: string;
  };
}