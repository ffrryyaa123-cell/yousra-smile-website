import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, VideoReview } from '../types';

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const FIRESTORE_DATABASE_ID = 'ai-studio-yousrasmile-a5551c6d-57e2-46b9-bc5e-1d53b9d471f1';
const db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);
const storage = getStorage(firebaseApp);

const cleanForFirestore = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const archiveId = (kind: string, id: string) => `${kind}-${id}-${Date.now()}`;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isMissingValue = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

function mergePreservingExisting<T>(existing: T, incoming: Partial<T>): T {
  if (!isPlainObject(existing) || !isPlainObject(incoming)) {
    return (isMissingValue(incoming) ? existing : incoming) as T;
  }

  const result: Record<string, unknown> = { ...existing as Record<string, unknown> };
  for (const [key, incomingValue] of Object.entries(incoming)) {
    if (isMissingValue(incomingValue)) continue;

    const existingValue = result[key];
    if (isPlainObject(existingValue) && isPlainObject(incomingValue)) {
      result[key] = mergePreservingExisting(existingValue, incomingValue);
      continue;
    }

    // Empty arrays coming from incomplete forms/imports must not erase existing media/features.
    if (Array.isArray(incomingValue) && incomingValue.length === 0 && Array.isArray(existingValue) && existingValue.length > 0) {
      continue;
    }

    result[key] = incomingValue;
  }

  return result as T;
}

async function buildSafeProduct(product: Product): Promise<Product> {
  const ref = doc(db, 'products', product.id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return cleanForFirestore(product);

  const existing = snapshot.data() as Product;
  return cleanForFirestore(mergePreservingExisting(existing, product));
}

async function archiveDocument(collectionName: 'products' | 'videos', id: string) {
  const sourceRef = doc(db, collectionName, id);
  const snapshot = await getDoc(sourceRef);
  if (!snapshot.exists()) return;

  await setDoc(doc(db, 'catalog_delete_archive', archiveId(collectionName, id)), {
    kind: collectionName,
    originalId: id,
    archivedAt: new Date().toISOString(),
    data: cleanForFirestore(snapshot.data())
  });
}

export const catalogDatabase = {
  subscribeProducts(onData: (products: Product[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(collection(db, 'products'), snapshot => {
      onData(snapshot.docs.map(item => item.data() as Product));
    }, error => onError?.(error));
  },

  subscribeVideos(onData: (videos: VideoReview[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(collection(db, 'videos'), snapshot => {
      onData(snapshot.docs.map(item => item.data() as VideoReview));
    }, error => onError?.(error));
  },

  async saveProduct(product: Product) {
    const safeProduct = await buildSafeProduct(product);
    return setDoc(doc(db, 'products', product.id), safeProduct, { merge: true });
  },

  saveVideo(video: VideoReview) {
    return setDoc(doc(db, 'videos', video.id), cleanForFirestore(video), { merge: true });
  },

  async saveProductAndVideo(product: Product, video: VideoReview) {
    const safeProduct = await buildSafeProduct(product);
    const batch = writeBatch(db);
    batch.set(doc(db, 'products', product.id), safeProduct, { merge: true });
    batch.set(doc(db, 'videos', video.id), cleanForFirestore(video), { merge: true });
    return batch.commit();
  },

  async saveProducts(products: Product[]) {
    // Read/merge each existing product first. This intentionally favors data integrity over bulk speed.
    // A partial CSV/import row can update supplied fields, but cannot blank unrelated product data.
    const safeProducts: Product[] = [];
    for (const product of products) {
      safeProducts.push(await buildSafeProduct(product));
    }

    for (let index = 0; index < safeProducts.length; index += 400) {
      const batch = writeBatch(db);
      safeProducts.slice(index, index + 400).forEach(product => {
        batch.set(doc(db, 'products', product.id), cleanForFirestore(product), { merge: true });
      });
      await batch.commit();
    }
  },

  async deleteProductAndVideos(productId: string, videoIds: string[]) {
    // Safety invariant: every destructive catalog action is archived first.
    // If archiving fails, deletion does not proceed.
    await archiveDocument('products', productId);
    for (const videoId of videoIds) await archiveDocument('videos', videoId);

    const batch = writeBatch(db);
    batch.delete(doc(db, 'products', productId));
    videoIds.forEach(videoId => batch.delete(doc(db, 'videos', videoId)));
    return batch.commit();
  },

  async removeProductVideoMetadata(productId: string, videoIds: string[]) {
    // Preserve the complete product/video records before removing media links.
    await archiveDocument('products', productId);
    for (const videoId of videoIds) await archiveDocument('videos', videoId);

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', productId), {
      videoUrl: deleteField(),
      videoThumbnailUrl: deleteField(),
      videoStoragePath: deleteField(),
      youtubeUrl: deleteField()
    });
    videoIds.forEach(videoId => batch.delete(doc(db, 'videos', videoId)));
    return batch.commit();
  },

  async deleteProduct(productId: string) {
    await archiveDocument('products', productId);
    return deleteDoc(doc(db, 'products', productId));
  },

  async deleteVideo(videoId: string) {
    await archiveDocument('videos', videoId);
    return deleteDoc(doc(db, 'videos', videoId));
  },

  clearProductVideo(productId: string) {
    return updateDoc(doc(db, 'products', productId), {
      videoUrl: deleteField(),
      videoThumbnailUrl: deleteField(),
      youtubeUrl: deleteField()
    });
  },

  uploadVideo(productId: string, file: File, onProgress?: (percent: number) => void) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storageRef = ref(storage, `products/${productId}/videos/${Date.now()}-${safeName}`);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'video/mp4' });
    return new Promise<{ url: string; storagePath: string }>((resolve, reject) => {
      task.on('state_changed', snapshot => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      }, reject, async () => {
        resolve({ url: await getDownloadURL(task.snapshot.ref), storagePath: task.snapshot.ref.fullPath });
      });
    });
  },

  async deleteStoredFile(urlOrPath?: string) {
    if (!urlOrPath) return;
    try {
      await deleteObject(ref(storage, urlOrPath));
    } catch (error: any) {
      if (error?.code !== 'storage/object-not-found' && error?.code !== 'storage/invalid-url') throw error;
    }
  }
};
