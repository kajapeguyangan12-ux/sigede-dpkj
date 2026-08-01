import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../app/masyarakat/lib/useCurrentUser';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateUserData {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as User));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as User));
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
}

// Get single user
export async function getUser(userId: string): Promise<User | null> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const found = snapshot.docs.find(d => d.id === userId);
    if (!found) return null;
    return {
      id: found.id,
      ...found.data(),
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

// Create new user
export async function createUser(data: CreateUserData): Promise<string> {
  try {
    const usersRef = collection(db, 'users');
    const userDoc = {
      ...data,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(usersRef, userDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(userId: string, data: UpdateUserData): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Check if user exists by email
export async function userExists(email: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
}
