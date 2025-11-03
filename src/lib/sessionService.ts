/**
 * Session Management Service
 * Implements single session per user (1 user = 1 active login)
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db as firestore } from './firebase';

const SESSIONS_COLLECTION = 'user_sessions';

export interface UserSession {
  userId: string;
  sessionId: string;
  userType: 'admin' | 'masyarakat';
  loginAt: Timestamp;
  lastActivity: Timestamp;
  deviceInfo: string;
  ipAddress?: string;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get device info for session tracking
 */
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown';
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown';
  return `${browser} on ${os}`;
}

/**
 * Create new session for user
 * Automatically terminates other active sessions for the same user
 */
export async function createUserSession(
  userId: string, 
  userType: 'admin' | 'masyarakat'
): Promise<string> {
  try {
    console.log('🔐 Creating new session for user:', userId);
    
    // 1. Check for existing sessions
    const existingSessionsQuery = query(
      collection(firestore, SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const existingSessionsSnapshot = await getDocs(existingSessionsQuery);
    
    // 2. Delete all existing sessions for this user
    if (!existingSessionsSnapshot.empty) {
      console.log(`🗑️ Found ${existingSessionsSnapshot.size} existing session(s), terminating...`);
      
      const deletePromises = existingSessionsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('✅ All previous sessions terminated');
    }
    
    // 3. Generate new session ID
    const sessionId = generateSessionId();
    
    // 4. Create new session document
    const sessionDoc: UserSession = {
      userId,
      sessionId,
      userType,
      loginAt: serverTimestamp() as Timestamp,
      lastActivity: serverTimestamp() as Timestamp,
      deviceInfo: getDeviceInfo(),
    };
    
    const sessionRef = doc(firestore, SESSIONS_COLLECTION, sessionId);
    await setDoc(sessionRef, sessionDoc);
    
    // 5. Store session ID in localStorage
    localStorage.setItem('sigede_session_id', sessionId);
    
    console.log('✅ New session created:', sessionId);
    return sessionId;
    
  } catch (error) {
    console.error('❌ Error creating session:', error);
    throw error;
  }
}

/**
 * Validate if current session is still active
 * Returns false if session doesn't exist or belongs to different device
 */
export async function validateSession(userId: string): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem('sigede_session_id');
    
    if (!sessionId) {
      console.log('⚠️ No session ID found in localStorage');
      return false;
    }
    
    // Check if session exists in Firestore
    const sessionRef = doc(firestore, SESSIONS_COLLECTION, sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      console.log('⚠️ Session not found in database');
      localStorage.removeItem('sigede_session_id');
      return false;
    }
    
    const sessionData = sessionSnap.data() as UserSession;
    
    // Verify session belongs to this user
    if (sessionData.userId !== userId) {
      console.log('⚠️ Session belongs to different user');
      localStorage.removeItem('sigede_session_id');
      return false;
    }
    
    // Update last activity
    await setDoc(sessionRef, {
      lastActivity: serverTimestamp()
    }, { merge: true });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error validating session:', error);
    return false;
  }
}

/**
 * Terminate current session
 */
export async function terminateSession(): Promise<void> {
  try {
    const sessionId = localStorage.getItem('sigede_session_id');
    
    if (sessionId) {
      console.log('🗑️ Terminating session:', sessionId);
      
      const sessionRef = doc(firestore, SESSIONS_COLLECTION, sessionId);
      await deleteDoc(sessionRef);
      
      localStorage.removeItem('sigede_session_id');
      console.log('✅ Session terminated');
    }
  } catch (error) {
    console.error('❌ Error terminating session:', error);
    // Still remove from localStorage even if Firestore delete fails
    localStorage.removeItem('sigede_session_id');
  }
}

/**
 * Terminate all sessions for a user
 */
export async function terminateAllUserSessions(userId: string): Promise<void> {
  try {
    console.log('🗑️ Terminating all sessions for user:', userId);
    
    const sessionsQuery = query(
      collection(firestore, SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const deletePromises = sessionsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    localStorage.removeItem('sigede_session_id');
    console.log(`✅ Terminated ${sessionsSnapshot.size} session(s)`);
    
  } catch (error) {
    console.error('❌ Error terminating sessions:', error);
    throw error;
  }
}

/**
 * Setup session check interval
 * Checks every 30 seconds if session is still valid
 */
export function setupSessionCheck(
  userId: string, 
  onSessionInvalidated: () => void
): NodeJS.Timeout {
  return setInterval(async () => {
    const isValid = await validateSession(userId);
    
    if (!isValid) {
      console.log('❌ Session invalidated - logging out');
      onSessionInvalidated();
    }
  }, 30000); // Check every 30 seconds
}
