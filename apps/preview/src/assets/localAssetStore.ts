export type LocalAssetKind = 'background' | 'ambience';
export interface StoredAsset { kind: LocalAssetKind; name: string; type: string; blob: Blob }
const limits = { background: 12 * 1024 * 1024, ambience: 40 * 1024 * 1024 };

export function validateLocalAsset(file: File, kind: LocalAssetKind): { ok: true } | { ok: false; error: string } {
  const validType = kind === 'background' ? file.type.startsWith('image/') : file.type.startsWith('audio/');
  if (!validType) return { ok: false, error: kind === 'background' ? '请选择图片文件' : '请选择音频文件' };
  if (file.size > limits[kind]) return { ok: false, error: kind === 'background' ? '图片不能超过 12 MB' : '音频不能超过 40 MB' };
  return { ok: true };
}

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) return Promise.reject(new Error('当前环境不支持本地素材存储'));
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open('companion-study-room-assets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('assets', { keyPath: 'kind' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalAsset(file: File, kind: LocalAssetKind): Promise<StoredAsset> {
  const validation = validateLocalAsset(file, kind);
  if (!validation.ok) throw new Error(validation.error);
  const asset = { kind, name: file.name, type: file.type, blob: file };
  const database = await openDatabase();
  await transaction(database, 'readwrite', store => store.put(asset));
  database.close();
  return asset;
}

export async function loadLocalAsset(kind: LocalAssetKind): Promise<StoredAsset | null> {
  const database = await openDatabase();
  const result = await transaction<StoredAsset | undefined>(database, 'readonly', store => store.get(kind));
  database.close();
  return result ?? null;
}

export async function removeLocalAsset(kind: LocalAssetKind): Promise<void> {
  const database = await openDatabase();
  await transaction(database, 'readwrite', store => store.delete(kind));
  database.close();
}

function transaction<T = undefined>(database: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = database.transaction('assets', mode);
    const request = action(tx.objectStore('assets'));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}
