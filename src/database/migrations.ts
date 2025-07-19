import fs from 'fs/promises';
import path from 'path';
import DatabaseConnection from './connection';

export class DatabaseMigrations {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async runInitialSetup(): Promise<void> {
    console.log('[INFO] Running database initial setup...');
    
    try {
      // Read and execute schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf-8');
      
      // Split by semicolon and execute each statement
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await this.db.query(statement);
      }

      console.log('[INFO] Database schema created successfully');
    } catch (error) {
      console.error('[ERROR] Failed to run database setup:', error);
      throw error;
    }
  }

  async checkAndMigrate(): Promise<void> {
    try {
      // Test connection first
      const isConnected = await this.db.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Check if tables exist
      const tableCheck = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('characters', 'metadata')
      `);

      if (tableCheck.rows.length < 2) {
        console.log('[INFO] Tables not found, running initial setup...');
        await this.runInitialSetup();
      } else {
        console.log('[INFO] Database tables already exist');
      }

      // Verify initial data
      const characterCount = await this.db.query('SELECT COUNT(*) FROM characters');
      console.log(`[INFO] Database contains ${characterCount.rows[0].count} characters`);

    } catch (error) {
      console.error('[ERROR] Database migration failed:', error);
      throw error;
    }
  }
}