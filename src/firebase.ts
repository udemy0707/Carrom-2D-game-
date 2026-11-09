import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with explicit database ID from provisioned config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Error handling helpers according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Quota State Management
let quotaExceededState = false;
const quotaListeners = new Set<(exceeded: boolean) => void>();

export function isQuotaExceeded(): boolean {
  return quotaExceededState;
}

export function notifyQuotaExceeded(): void {
  if (!quotaExceededState) {
    quotaExceededState = true;
    quotaListeners.forEach((cb) => cb(true));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore_quota_exceeded'));
    }
  }
}

export function subscribeToQuotaState(callback: (exceeded: boolean) => void): () => void {
  quotaListeners.add(callback);
  callback(quotaExceededState);
  return () => {
    quotaListeners.delete(callback);
  };
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as any)?.code;
  return code === 'resource-exhausted' || msg.includes('resource-exhausted') || msg.includes('Quota exceeded');
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (isQuotaError(error)) {
    notifyQuotaExceeded();
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || getDeviceUid(),
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'deposit'));
    console.log('Successfully connected to Firebase Firestore!');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('resource-exhausted') || msg.includes('Quota exceeded')) {
      notifyQuotaExceeded();
      console.warn('Firestore daily quota exceeded. Offline/local mode active.');
    } else if (msg.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or internet connection.');
    }
  }
}
testConnection();

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function getDeviceUid(): string {
  if (typeof window === 'undefined') return 'server_session';
  let uid = sessionStorage.getItem('carrom_session_uid');
  if (!uid) {
    uid = 'player_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    sessionStorage.setItem('carrom_session_uid', uid);
  }
  return uid;
}

// Device/Auth session manager without non-configured anonymous auth
export async function ensureFirebaseAuth(): Promise<AppUser> {
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
    };
  }

  return {
    uid: getDeviceUid(),
    email: null,
    displayName: 'Guest Player',
  };
}

export async function signInWithGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
    };
  } catch (err) {
    console.error('Google Sign In error:', err);
    throw err;
  }
}

