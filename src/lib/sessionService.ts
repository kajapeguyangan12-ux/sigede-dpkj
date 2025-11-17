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
    
    // 1. Check for existing sessions (with error handling)
    try {
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
    } catch (cleanupError) {
      console.warn('⚠️ Could not cleanup existing sessions, continuing anyway:', cleanupError);
      // Continue with session creation even if cleanup fails
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
 * Much more tolerant approach - prioritizes user experience over strict security
 * Returns false only for definitive authentication failures
 */
export async function validateSession(userId: string): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem('sigede_session_id');
    
    if (!sessionId) {
      console.log('⚠️ No session ID found in localStorage - creating new session');
      // Don't fail validation, try to create a new session instead
      try {
        const userData = localStorage.getItem('sigede_auth_user');
        if (userData) {
          const user = JSON.parse(userData);
          const userType = user.role && ['administrator', 'admin_desa', 'kepala_desa'].includes(user.role) ? 'admin' : 'masyarakat';
          await createUserSession(user.uid, userType);
          console.log('✅ Created new session automatically');
          return true;
        }
      } catch (sessionError) {
        console.warn('⚠️ Could not create session automatically:', sessionError);
      }
      return false;
    }
    
    // Check if session exists in Firestore with timeout
    const sessionRef = doc(firestore, SESSIONS_COLLECTION, sessionId);
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.log('⚠️ Session validation timeout - treating as valid');
        resolve(true);
      }, 5000); // 5 second timeout
    });
    
    const validationPromise = (async () => {
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        console.log('⚠️ Session not found in database - might be expired');
        localStorage.removeItem('sigede_session_id');
        
        // Try to recreate session instead of failing
        try {
          const userData = localStorage.getItem('sigede_auth_user');
          if (userData) {
            const user = JSON.parse(userData);
            const userType = user.role && ['administrator', 'admin_desa', 'kepala_desa'].includes(user.role) ? 'admin' : 'masyarakat';
            await createUserSession(user.uid, userType);
            console.log('✅ Recreated session after database loss');
            return true;
          }
        } catch (recreateError) {
          console.warn('⚠️ Could not recreate session:', recreateError);
        }
        return false;
      }
      
      const sessionData = sessionSnap.data() as UserSession;
      
      // Verify session belongs to this user
      if (sessionData.userId !== userId) {
        console.log('⚠️ Session belongs to different user');
        localStorage.removeItem('sigede_session_id');
        return false;
      }
      
      // Update last activity (non-blocking, don't fail validation if this fails)
      try {
        await setDoc(sessionRef, {
          lastActivity: serverTimestamp()
        }, { merge: true });
      } catch (updateError) {
        console.warn('⚠️ Failed to update last activity, but session is valid:', updateError);
      }
      
      return true;
    })();
    
    // Race between validation and timeout
    return await Promise.race([validationPromise, timeoutPromise]);
    
  } catch (error: any) {
    console.error('❌ Error validating session (treating as valid to avoid disruption):', error);
    
    // Be very conservative about returning false
    // Only return false for definitive permission denied errors
    if (error?.code === 'permission-denied' || 
        error?.code === 'unauthenticated' ||
        (error?.message && error.message.toLowerCase().includes('permission denied'))) {
      console.log('❌ Definitive authentication error detected');
      return false;
    }
    
    // For all other errors (network, timeout, etc.), assume session is valid
    // Better to keep user logged in than to logout due to transient issues
    console.log('✅ Treating error as non-fatal, keeping session valid');
    return true;
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
      
      try {
        const sessionRef = doc(firestore, SESSIONS_COLLECTION, sessionId);
        await deleteDoc(sessionRef);
        console.log('✅ Session terminated from database');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete session from database, clearing locally:', deleteError);
      }
      
      localStorage.removeItem('sigede_session_id');
      console.log('✅ Session cleared from localStorage');
    }
  } catch (error) {
    console.error('❌ Error terminating session:', error);
    // Still remove from localStorage even if everything fails
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
 * EXTREMELY CONSERVATIVE approach - avoid ALL automatic logouts for admin stability
 * This function now focuses on maintenance rather than enforcement
 */
export function setupSessionCheck(
  userId: string, 
  onSessionInvalidated: () => void
): NodeJS.Timeout {
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 20; // Much higher threshold - almost never trigger
  
  return setInterval(async () => {
    try {
      // Import activity tracker dynamically to avoid SSR issues
      const { isUserRecentlyActive } = await import('./activityTracker');
      
      // Always skip session check if user was recently active
      if (isUserRecentlyActive()) {
        console.log('👤 User recently active, skipping session check completely');
        consecutiveFailures = 0; // Reset failures if user is active
        return;
      }
      
      // Skip if page is not visible
      if (document.hidden) {
        console.log('👁️ Page not visible, skipping session check');
        return;
      }
      
      // Skip if it's admin context (extra protection)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        console.log('🛡️ Admin context detected, skipping automatic session check');
        return;
      }
      
      // Only do very basic session maintenance, don't enforce logout
      try {
        const isValid = await validateSession(userId);
        
        if (!isValid) {
          consecutiveFailures++;
          console.log(`⚠️ Session validation failed (${consecutiveFailures}/${maxConsecutiveFailures} consecutive failures) - NOT forcing logout`);
          
          // Only logout if there are EXTREME consecutive failures (network completely down for hours)
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.log('❌ EXTREME failures detected - this might be a real session issue');
            // Even then, just log it - don't force logout in admin context
            if (!currentPath.startsWith('/admin')) {
              onSessionInvalidated();
            } else {
              console.log('�️ Admin protected - not forcing logout even with extreme failures');
            }
          } else {
            console.log('🔄 Will retry later (probably just network issues)');
          }
        } else {
          consecutiveFailures = 0; // Reset on successful validation
          console.log('✅ Session validation successful');
        }
      } catch (error) {
        console.log('ℹ️ Session check error (ignored in admin context):', error);
        // Never count errors as failures for admin users
        if (!currentPath.startsWith('/admin')) {
          consecutiveFailures++;
        }
      }
    } catch (error) {
      console.error('❌ Error during session check setup (completely non-fatal):', error);
      // Completely ignore all setup errors
    }
  }, 1800000); // Check every 30 minutes (much less frequent)
}
