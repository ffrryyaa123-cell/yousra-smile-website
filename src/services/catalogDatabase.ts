import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc
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
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const cleanForFirestore = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

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

  saveProduct(product: Product) {
    return setDoc(doc(db, 'products', product.id), cleanForFirestore(product), { merge: true });
  },

  saveVideo(video: VideoReview) {
    return setDoc(doc(db, 'videos', video.id), cleanForFirestore(video), { merge: true });
  },

  deleteProduct(productId: string) {
    return deleteDoc(doc(db, 'products', productId));
  },

  deleteVideo(videoId: string) {
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
