import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleSheetsConnection {
  private static instance: GoogleSheetsConnection;
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  private constructor() {
    // 環境変数から認証情報を取得
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';

    if (!serviceAccountEmail || !privateKey || !this.spreadsheetId) {
      throw new Error('Google Sheets credentials are not properly configured');
    }

    // JWT認証設定
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  public static getInstance(): GoogleSheetsConnection {
    if (!GoogleSheetsConnection.instance) {
      GoogleSheetsConnection.instance = new GoogleSheetsConnection();
    }
    return GoogleSheetsConnection.instance;
  }

  public getSheets(): sheets_v4.Sheets {
    return this.sheets;
  }

  public getSpreadsheetId(): string {
    return this.spreadsheetId;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      console.log(`[INFO] Connected to spreadsheet: ${response.data.properties?.title}`);
      return true;
    } catch (error) {
      console.error('[ERROR] Failed to connect to Google Sheets:', error);
      return false;
    }
  }

  public async readRange(range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });
      
      return response.data.values || [];
    } catch (error) {
      console.error(`[ERROR] Failed to read range ${range}:`, error);
      throw error;
    }
  }

  public async writeRange(range: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });
    } catch (error) {
      console.error(`[ERROR] Failed to write range ${range}:`, error);
      throw error;
    }
  }

  public async appendRows(range: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values,
        },
      });
    } catch (error) {
      console.error(`[ERROR] Failed to append rows to ${range}:`, error);
      throw error;
    }
  }

  public async clearRange(range: string): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });
    } catch (error) {
      console.error(`[ERROR] Failed to clear range ${range}:`, error);
      throw error;
    }
  }
}