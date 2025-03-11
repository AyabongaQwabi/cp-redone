import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  writeBatch,
} from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage,
  connectStorageEmulator,
} from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: `1:${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}:web:8f4f6669fae7cbf8c0bdbb`,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - simplified to ensure consistent initialization
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Export writeBatch function
export { writeBatch };

// Initialize Analytics only on client side
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app);
  }
  return null;
};

// Custom hook for interacting with Firebase Storage
export const useFirebaseStorage = () => storage;

export const uploadFile = async (file: File, path: string) => {
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
};

console.log('ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8082);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
