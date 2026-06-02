/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo } from './types.ts';
// Prioritize environment variables (Vite Secrets)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '';

// Initialize Firebase only if we have a config (prevents blank screen crash if secrets are missing)
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null as any;

// Initialize Auth
export const auth = app ? getAuth(app) : null as any;

// Initialize Firestore
export const db = app ? getFirestore(app, firestoreDatabaseId) : null as any;

/**
 * Handle Firestore exceptions to print standard diagnostic JSON error payloads as strictly required.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
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
