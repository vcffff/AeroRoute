'use client';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';

function auth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  if (!config.apiKey || !config.authDomain || !config.projectId) throw new Error('Firebase client configuration is missing');
  return getAuth(getApps()[0] ?? initializeApp(config));
}
export async function firebaseLogin(email: string, password: string, signup = false) {
  const instance = auth();
  await setPersistence(instance, browserSessionPersistence);
  const credential = await (signup ? createUserWithEmailAndPassword(instance, email, password) : signInWithEmailAndPassword(instance, email, password));
  const idToken = await credential.user.getIdToken();
  await signOut(instance);
  return idToken;
}
export async function firebaseResetPassword(email: string) { await sendPasswordResetEmail(auth(), email); }
export const firebaseSignup = (email: string, password: string) => firebaseLogin(email, password, true);
export const firebaseReset = firebaseResetPassword;
export async function firebaseLogout() { await signOut(auth()); }
