// src/services/offlineStorage.tsx
import { openDB, DBSchema } from 'idb';
import { IArticle } from '../types';

interface GamutDB extends DBSchema {
  'feed-cache': {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
  'saved-articles': {
    key: string;
    value: IArticle & { 
      offlineImageBlob?: Blob; 
      savedAt: number; 
    };
  };
}

const DB_NAME = 'the-gamut-db';
const STORE_NAME_FEED = 'feed-cache';
const STORE_NAME_SAVED = 'saved-articles';
const VERSION = 2; // Upgraded from 1 to 2

// Initialize the Database
const initDB = async () => {
  return openDB<GamutDB>(DB_NAME, VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // 1. Preserve existing feed-cache
      if (!db.objectStoreNames.contains(STORE_NAME_FEED)) {
        db.createObjectStore(STORE_NAME_FEED);
      }

      // 2. Add new store for offline reading (Version 2+)
      if (!db.objectStoreNames.contains(STORE_NAME_SAVED)) {
        db.createObjectStore(STORE_NAME_SAVED, { keyPath: '_id' });
      }
    },
  });
};

const offlineStorage = {
  // --- EXISTING: Feed Cache Methods ---

  // Save data to the phone (Feed)
  save: async (key: string, data: any): Promise<void> => {
    try {
      const db = await initDB();
      const record = {
        data,
        timestamp: Date.now()
      };
      await db.put(STORE_NAME_FEED, record, key);
      console.log(`💾 [Offline] Saved Feed: ${key}`);
    } catch (error) {
      console.warn('Offline Storage Save Error:', error);
    }
  },

  // Get data from the phone (Feed)
  get: async (key: string): Promise<any | null> => {
    try {
      const db = await initDB();
      const record = await db.get(STORE_NAME_FEED, key);
      if (!record) return null;
      
      console.log(`📂 [Offline] Loaded Feed: ${key} (Age: ${((Date.now() - record.timestamp)/1000).toFixed(0)}s)`);
      return record.data;
    } catch (error) {
      console.warn('Offline Storage Get Error:', error);
      return null;
    }
  },

  // Clear specific data (Feed)
  clear: async (key: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME_FEED, key);
    } catch (error) {
      console.warn('Offline Storage Clear Error:', error);
    }
  },

  // --- NEW: Offline Article Methods (Read Later) ---

  saveOfflineArticle: async (article: IArticle): Promise<void> => {
    try {
      const db = await initDB();
      
      // 1. Attempt to fetch the image as a Blob for offline viewing
      let imageBlob: Blob | undefined;
      // Check common image field names
      // @ts-ignore - covering potential field naming variations
      const imageUrl = article.imageUrl || article.urlToImage || article.image;

      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        try {
          const response = await fetch(imageUrl, { mode: 'cors' });
          if (response.ok) {
            imageBlob = await response.blob();
          }
        } catch (imgErr) {
          console.warn('Failed to download image for offline:', imgErr);
        }
      }

      // 2. Store Article + Blob
      await db.put(STORE_NAME_SAVED, {
        ...article,
        offlineImageBlob: imageBlob,
        savedAt: Date.now()
      });

      console.log(`📗 [Offline] Article Cached: ${article.title}`);

    } catch (error) {
      console.error('Offline Article Save Failed:', error);
    }
  },

  getOfflineArticle: async (id: string): Promise<(IArticle & { offlineImageBlob?: Blob }) | undefined> => {
    try {
      const db = await initDB();
      return await db.get(STORE_NAME_SAVED, id);
    } catch (error) {
      console.warn('Offline Article Fetch Error:', error);
      return undefined;
    }
  },

  removeOfflineArticle: async (id: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME_SAVED, id);
      console.log(`🗑️ [Offline] Article Removed: ${id}`);
    } catch (error) {
      console.warn('Offline Article Remove Error:', error);
    }
  }
};

export default offlineStorage;
