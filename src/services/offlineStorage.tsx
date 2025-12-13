// src/services/offlineStorage.ts
import { openDB, DBSchema } from 'idb';

interface GamutDB extends DBSchema {
  'feed-cache': {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'the-gamut-db';
const STORE_NAME = 'feed-cache';
const VERSION = 1;

// Initialize the Database
const initDB = async () => {
  return openDB<GamutDB>(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

const offlineStorage = {
  // Save data to the phone
  save: async (key: string, data: any): Promise<void> => {
    try {
      const db = await initDB();
      const record = {
        data,
        timestamp: Date.now()
      };
      await db.put(STORE_NAME, record, key);
      console.log(`💾 [Offline] Saved: ${key}`);
    } catch (error) {
      console.warn('Offline Storage Save Error:', error);
    }
  },

  // Get data from the phone
  get: async (key: string): Promise<any | null> => {
    try {
      const db = await initDB();
      const record = await db.get(STORE_NAME, key);
      if (!record) return null;
      
      console.log(`📂 [Offline] Loaded: ${key} (Age: ${((Date.now() - record.timestamp)/1000).toFixed(0)}s)`);
      return record.data;
    } catch (error) {
      console.warn('Offline Storage Get Error:', error);
      return null;
    }
  },

  // Clear specific data
  clear: async (key: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.warn('Offline Storage Clear Error:', error);
    }
  }
};

export default offlineStorage;
