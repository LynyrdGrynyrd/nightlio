const DB_NAME = 'twilightio_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

export interface QueueItem {
  id: number;
  type: 'CREATE_ENTRY' | 'UPDATE_ENTRY';
  payload: unknown;
  timestamp: number;
}

interface Mutation {
  type: 'CREATE_ENTRY' | 'UPDATE_ENTRY';
  payload: unknown;
}

class OfflineStorage {
  private async _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('IndexedDB error: ' + request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
    });
  }

  async addToQueue(mutation: Mutation): Promise<IDBValidKey> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        ...mutation,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getQueue(): Promise<QueueItem[]> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as QueueItem[]);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromQueue(id: number): Promise<void> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearQueue(): Promise<void> {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
