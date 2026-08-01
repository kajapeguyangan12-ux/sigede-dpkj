import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

export const signInAdmin = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signOutAdmin = async () => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    callback(user);
  });
  return unsubscribe;
};

export const ensureAdminRecord = async (user: User) => {
  if (!user?.uid) {
    return;
  }

  const adminRef = doc(db, 'admins', user.uid);
  const snapshot = await getDoc(adminRef);

  if (!snapshot.exists()) {
    await setDoc(adminRef, {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      createdAt: serverTimestamp()
    });
  }
};
