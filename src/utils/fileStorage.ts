/**
 * Client-Side Binary File Storage
 * 
 * Provides in-memory caching and persistent IndexedDB storage for real
 * user-uploaded files (images, PDFs, logs, etc.). This ensures uploaded files
 * are never modified, never replaced with sample content, survive page refreshes,
 * and do not exceed localStorage quotas.
 */

const DB_NAME = 'pubvantage_evidence_store';
const DB_VERSION = 4;
const STORE_NAME = 'uploaded_files';

// Fast in-memory cache of File/Blob objects for zero-latency downloads
const memoryCache = new Map<string, Blob | File>();

function inferMime(filename?: string): string {
  if (!filename) return 'application/octet-stream';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'pdf': return 'application/pdf';
    case 'json': return 'application/json';
    case 'xml': return 'application/xml';
    case 'log':
    case 'txt': return 'text/plain';
    case 'patch':
    case 'diff': return 'text/x-diff';
    default: return 'application/octet-stream';
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Opens or initializes the IndexedDB object store for binary files.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        store = (e.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
      }
      if (!store.indexNames.contains('storageKey')) {
        store.createIndex('storageKey', 'storageKey', { unique: false });
      }
      if (!store.indexNames.contains('fileId')) {
        store.createIndex('fileId', 'fileId', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };
    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked by another open connection.');
    };
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

/**
 * Stores a user-uploaded File or Blob in memory, IndexedDB, and sessionStorage backup.
 * Indexes by primary key `id`, optional `storageKey`, and optional `fileId`.
 */
export async function storeUploadedFile(
  id: string,
  file: Blob | File,
  customName?: string,
  storageKey?: string,
  fileId?: string
): Promise<void> {
  if (!id || !file) return;

  const fileName = customName || (file instanceof File ? file.name : 'attachment');
  const fileType = file.type || inferMime(fileName);
  const effectiveFileId = fileId || id;
  const effectiveStorageKey = storageKey || id;

  // 1. Store in memory cache under all keys for instant zero-latency access
  memoryCache.set(id, file);
  if (storageKey) memoryCache.set(storageKey, file);
  if (fileId) memoryCache.set(fileId, file);

  // 2. Read raw binary ArrayBuffer for foolproof persistence across page reloads
  let buffer: ArrayBuffer | null = null;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    console.warn('Could not read file as ArrayBuffer:', err);
  }

  // 3. Optional sessionStorage backup for smaller files (< 2MB)
  if (buffer && buffer.byteLength < 2000000 && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const base64 = arrayBufferToBase64(buffer);
      const sessionPayload = JSON.stringify({
        id,
        fileId: effectiveFileId,
        storageKey: effectiveStorageKey,
        name: fileName,
        type: fileType,
        size: file.size,
        data: base64
      });
      window.sessionStorage.setItem(`pubvantage_f_${id}`, sessionPayload);
      if (storageKey) {
        window.sessionStorage.setItem(`pubvantage_f_${storageKey}`, sessionPayload);
      }
      if (fileId) {
        window.sessionStorage.setItem(`pubvantage_f_${fileId}`, sessionPayload);
      }
    } catch {
      // quota or sandboxed mode, ignore
    }
  }

  // 4. Persist to IndexedDB as raw ArrayBuffer (safe across all browser engines)
  if (buffer) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record = {
          id,
          fileId: effectiveFileId,
          storageKey: effectiveStorageKey,
          name: fileName,
          type: fileType,
          size: file.size,
          buffer: buffer,
          storedAt: Date.now()
        };

        // Primary key write
        store.put(record);

        // Alias writes so direct primary-key lookups work 100% reliably without index dependencies
        if (effectiveStorageKey && effectiveStorageKey !== id) {
          store.put({ ...record, id: effectiveStorageKey });
        }
        if (effectiveFileId && effectiveFileId !== id && effectiveFileId !== effectiveStorageKey) {
          store.put({ ...record, id: effectiveFileId });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Could not persist file to IndexedDB, retained in memory cache / session storage:', err);
    }
  }
}

/**
 * Retrieves a user-uploaded File or Blob by attachment ID, storageKey, or fileId.
 * Checks memory cache first, then IndexedDB (by id, index, and full scan), then sessionStorage.
 */
export async function getUploadedFile(idOrKey: string): Promise<Blob | File | null> {
  if (!idOrKey) return null;

  // 1. Check in-memory cache
  if (memoryCache.has(idOrKey)) {
    const cached = memoryCache.get(idOrKey);
    if (cached && (cached as Blob).size > 0) return cached;
  }

  // Helper to reconstitute File or Blob from record
  const reconstitute = (record: any): Blob | File | null => {
    if (!record) return null;
    const mime = record.type || inferMime(record.name || 'file');
    let resultBlob: Blob | File | null = null;

    if (record.buffer instanceof ArrayBuffer) {
      try {
        if (record.name && typeof File !== 'undefined') {
          resultBlob = new File([record.buffer], record.name, { type: mime });
        } else {
          resultBlob = new Blob([record.buffer], { type: mime });
        }
      } catch {
        resultBlob = new Blob([record.buffer], { type: mime });
      }
    } else if (ArrayBuffer.isView(record.buffer)) {
      try {
        const view = record.buffer as any;
        if (record.name && typeof File !== 'undefined') {
          resultBlob = new File([view], record.name, { type: mime });
        } else {
          resultBlob = new Blob([view], { type: mime });
        }
      } catch {
        resultBlob = new Blob([record.buffer as any], { type: mime });
      }
    } else if (record.file instanceof Blob) {
      resultBlob = record.file;
    } else if (record.blob instanceof Blob) {
      resultBlob = record.blob;
    } else if (record.fileData && typeof record.fileData === 'string') {
      const parts = record.fileData.split(',');
      if (parts.length > 1 && parts[0].includes(';base64')) {
        resultBlob = base64ToBlob(parts[1], mime);
      } else {
        resultBlob = new Blob([record.fileData], { type: mime });
      }
    }

    if (resultBlob && resultBlob.size > 0) {
      if (record.id) memoryCache.set(record.id, resultBlob);
      if (record.storageKey) memoryCache.set(record.storageKey, resultBlob);
      if (record.fileId) memoryCache.set(record.fileId, resultBlob);
      memoryCache.set(idOrKey, resultBlob);
    }
    return resultBlob;
  };

  // 2. Check IndexedDB
  try {
    const db = await openDB();
    const stored = await new Promise<Blob | File | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      // Primary key lookup (instant $O(1)$)
      const req = store.get(idOrKey);
      req.onsuccess = () => {
        if (req.result) {
          resolve(reconstitute(req.result));
          return;
        }

        // Secondary index lookup: storageKey
        if (store.indexNames.contains('storageKey')) {
          try {
            const idxReq = store.index('storageKey').get(idOrKey);
            idxReq.onsuccess = () => {
              if (idxReq.result) {
                resolve(reconstitute(idxReq.result));
                return;
              }
              checkFileId();
            };
            idxReq.onerror = () => checkFileId();
          } catch {
            checkFileId();
          }
        } else {
          checkFileId();
        }

        function checkFileId() {
          if (store.indexNames.contains('fileId')) {
            try {
              const fReq = store.index('fileId').get(idOrKey);
              fReq.onsuccess = () => {
                if (fReq.result) {
                  resolve(reconstitute(fReq.result));
                  return;
                }
                scanAll();
              };
              fReq.onerror = () => scanAll();
            } catch {
              scanAll();
            }
          } else {
            scanAll();
          }
        }

        // Exact match scan only — NEVER match loosely on filename
        function scanAll() {
          try {
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (cursor) {
                const rec = cursor.value;
                if (
                  rec.id === idOrKey ||
                  rec.storageKey === idOrKey ||
                  rec.fileId === idOrKey
                ) {
                  resolve(reconstitute(rec));
                  return;
                }
                cursor.continue();
              } else {
                resolve(null);
              }
            };
            cursorReq.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        }
      };

      req.onerror = () => resolve(null);
    });

    if (stored && (stored as Blob).size > 0) return stored;
  } catch (err) {
    console.warn('Failed to retrieve file from IndexedDB:', err);
  }

  // 3. Check sessionStorage fallback
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const sessionItem =
        window.sessionStorage.getItem(`pubvantage_f_${idOrKey}`) ||
        window.sessionStorage.getItem(idOrKey);
      if (sessionItem) {
        const parsed = JSON.parse(sessionItem);
        if (parsed && parsed.data) {
          const mime = parsed.type || inferMime(parsed.name || 'file');
          const blob = base64ToBlob(parsed.data, mime);
          if (blob && blob.size > 0) {
            memoryCache.set(idOrKey, blob);
            return blob;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Checks if a file exists in memory or IndexedDB.
 */
export function hasInMemoryFile(id: string): boolean {
  return memoryCache.has(id);
}

/**
 * Deletes a file from in-memory cache, IndexedDB, and sessionStorage.
 */
export async function removeUploadedFile(idOrKey: string): Promise<void> {
  if (!idOrKey) return;

  memoryCache.delete(idOrKey);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(`pubvantage_f_${idOrKey}`);
      window.sessionStorage.removeItem(idOrKey);
    } catch {
      // ignore
    }
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const req = store.get(idOrKey);
      req.onsuccess = () => {
        const rec = req.result;
        if (rec) {
          if (rec.id) {
            memoryCache.delete(rec.id);
            store.delete(rec.id);
            if (typeof window !== 'undefined' && window.sessionStorage) {
              try { window.sessionStorage.removeItem(`pubvantage_f_${rec.id}`); } catch {}
            }
          }
          if (rec.storageKey) {
            memoryCache.delete(rec.storageKey);
            store.delete(rec.storageKey);
            if (typeof window !== 'undefined' && window.sessionStorage) {
              try { window.sessionStorage.removeItem(`pubvantage_f_${rec.storageKey}`); } catch {}
            }
          }
          if (rec.fileId) {
            memoryCache.delete(rec.fileId);
            store.delete(rec.fileId);
            if (typeof window !== 'undefined' && window.sessionStorage) {
              try { window.sessionStorage.removeItem(`pubvantage_f_${rec.fileId}`); } catch {}
            }
          }
        }
        store.delete(idOrKey);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    // ignore
  }
}
