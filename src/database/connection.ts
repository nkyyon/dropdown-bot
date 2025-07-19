import { Pool, PoolClient } from 'pg';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('[ERROR] Unexpected database pool error:', err);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('[INFO] Database connection successful:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('[ERROR] Database connection failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseConnection;