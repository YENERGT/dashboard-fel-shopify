import { google } from 'googleapis';
import { getEnv } from './env.server';
import { getCachedData, setCachedData } from './cache.server';

export async function getGoogleSheetsData() {
  const cacheKey = 'google-sheets-data';
  
  // Intentar obtener datos del caché primero
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Si no hay caché, obtener de Google Sheets
  const env = getEnv();
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_ID,
    range: 'REGISTRO!A:P',
  });

  const data = response.data.values;
  
  // Guardar en caché
  setCachedData(cacheKey, data);
  
  return data;
}

export async function getGoogleSheetsPagos() {
  const cacheKey = 'google-sheets-pagos';
  
  // Intentar obtener datos del caché primero
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Si no hay caché, obtener de Google Sheets
  const env = getEnv();
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_ID,
    range: 'PAGOS!A:D',
  });

  const data = response.data.values;
  
  // Guardar en caché
  setCachedData(cacheKey, data);
  
  return data;
}