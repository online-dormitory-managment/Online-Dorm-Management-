/**
 * A simple utility to persist form data (including files) across page reloads.
 * Uses LocalStorage for text and IndexedDB for Blobs/Files.
 */

const DB_NAME = 'DormAppDraftDB';
const STORE_NAME = 'draftFiles';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveDraft = async (textData, files) => {
  // Save text data to LocalStorage
  localStorage.setItem('dorm_app_draft_text', JSON.stringify(textData));

  // Save files to IndexedDB
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const [key, file] of Object.entries(files)) {
    if (file instanceof File) {
      store.put(file, key);
    } else {
      store.delete(key);
    }
  }
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const loadDraft = async () => {
  const textData = JSON.parse(localStorage.getItem('dorm_app_draft_text') || '{}');
  
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const fileKeys = ['fydaFront', 'fydaBack', 'addisLetter', 'paymentReceipt'];
  const files = {};
  
  for (const key of fileKeys) {
    const request = store.get(key);
    await new Promise((resolve) => {
      request.onsuccess = (e) => {
        if (e.target.result) {
          // Reconstruct File object if needed, though Blob works for many things
          files[key] = e.target.result;
        }
        resolve();
      };
      request.onerror = () => resolve();
    });
  }
  
  return { ...textData, files };
};

export const clearDraft = async () => {
  localStorage.removeItem('dorm_app_draft_text');
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
};
