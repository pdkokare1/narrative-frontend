// src/services/offlineStorage.js
import { openDB } from 'idb';

const DB_NAME = 'the-gamut-db';
const STORE_NAME = 'feed-cache';
const VERSION = 1;

// Initialize the Database
const initDB = async () => {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

const offlineStorage = {
  // Save data to the phone
  save: async (key, data) => {
    try {
      const db = await initDB();
      // Add a timestamp so we know how old this data is
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
  get: async (key) => {
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

  // Clear specific data (e.g. on logout)
  clear: async (key) => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.warn('Offline Storage Clear Error:', error);
    }
  }
};

export default offlineStorage;
