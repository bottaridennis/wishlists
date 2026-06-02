/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo } from './types.ts';
import firebaseConfigFromJson from '../firebase-applet-config.json';

// Prioritize environment variables (Vite Secrets) and fallback to local JSON file for sandbox testing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFromJson.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFromJson.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFromJson.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFromJson.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFromJson.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFromJson.appId || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigFromJson.measurementId || '',
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigFromJson.firestoreDatabaseId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app, firestoreDatabaseId);

/**
 * Handle Firestore exceptions to print standard diagnostic JSON error payloads as strictly required.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email || null,
      })) || [],
    },
    operationType,
    path,
  };
  
  console.error('Firestore Action Rejected: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
