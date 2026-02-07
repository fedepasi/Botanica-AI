const DB_NAME = 'BotanicaAI-DB';
const DB_VERSION = 1;
const IMAGE_STORE_NAME = 'plant_images';

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject('IndexedDB not supported');
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject("Error opening DB");
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                db.createObjectStore(IMAGE_STORE_NAME);
            }
        };
    });
};

export const saveImage = async (id: string, imageDataUrl: string): Promise<void> => {
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        return;
    }
    const db = await getDB();
    const blob = await (await fetch(imageDataUrl)).blob();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IMAGE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.put(blob, id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IMAGE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result as Blob | undefined);
        request.onerror = () => reject(request.error);
    });
};

export const deleteImage = async (id: string): Promise<void> => {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(IMAGE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        store.delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};