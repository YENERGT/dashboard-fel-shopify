// Cache simple usando Cloud Storage para persistencia entre restarts
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = 'dashboard-fel-cache'; // Crear bucket gratis

export async function getCachedFromStorage(key) {
  try {
    const file = storage.bucket(bucketName).file(`cache/${key}.json`);
    const [exists] = await file.exists();
    
    if (!exists) return null;
    
    const [contents] = await file.download();
    const data = JSON.parse(contents.toString());
    
    // Verificar TTL
    if (Date.now() > data.expires) {
      await file.delete().catch(() => {});
      return null;
    }
    
    console.log(`[STORAGE CACHE HIT] ${key}`);
    return data.value;
  } catch (error) {
    console.log(`[STORAGE CACHE MISS] ${key}:`, error.message);
    return null;
  }
}

export async function setCachedToStorage(key, value, ttlMinutes = 10) {
  try {
    const data = {
      value,
      expires: Date.now() + (ttlMinutes * 60 * 1000),
      created: Date.now()
    };
    
    const file = storage.bucket(bucketName).file(`cache/${key}.json`);
    await file.save(JSON.stringify(data));
    
    console.log(`[STORAGE CACHE SET] ${key} - TTL: ${ttlMinutes}min`);
  } catch (error) {
    console.log(`[STORAGE CACHE ERROR] ${key}:`, error.message);
  }
}