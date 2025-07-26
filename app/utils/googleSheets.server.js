import { google } from 'googleapis';
import { getEnv } from './env.server';
import { getCachedData, appCache } from './cache.server';

// Función optimizada para obtener datos de Google Sheets con caché
export async function getGoogleSheetsData() {
  const cacheKey = 'google_sheets_raw_registro';
  
  return getCachedData(cacheKey, async () => {
    console.log('[GOOGLE SHEETS] Fetching REGISTRO data from API...');
    
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
    console.log(`[GOOGLE SHEETS] Fetched ${data?.length || 0} rows from REGISTRO`);
    
    return data;
  });
}

export async function getGoogleSheetsPagos() {
  const cacheKey = 'google_sheets_raw_pagos';
  
  return getCachedData(cacheKey, async () => {
    console.log('[GOOGLE SHEETS] Fetching PAGOS data from API...');
    
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
    console.log(`[GOOGLE SHEETS] Fetched ${data?.length || 0} rows from PAGOS`);
    
    return data;
  });
}

// Función para invalidar caché cuando se detecten cambios
export function invalidateGoogleSheetsCache() {
  appCache.delete('google_sheets_raw_registro');
  appCache.delete('google_sheets_raw_pagos');
  console.log('[GOOGLE SHEETS] Cache invalidated');
}

// Función para obtener estadísticas del caché
export function getGoogleSheetsCacheStats() {
  return appCache.getStats();
}