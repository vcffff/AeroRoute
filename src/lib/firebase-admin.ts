import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function adminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId) throw new Error('Firebase server configuration is missing');
  if (clientEmail && privateKey)
    return initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) });
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS)
    return initializeApp({ projectId, credential: applicationDefault() });
  throw new Error('Firebase server credentials are missing');
}
export const firebaseAuth = () => getAuth(adminApp());
export const firestore = () => getFirestore(adminApp());
export const getAdminAuth = firebaseAuth;
export const getAdminFirestore = firestore;
