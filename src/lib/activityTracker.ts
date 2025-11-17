/**
 * Activity Tracker untuk mendeteksi user activity
 * Digunakan untuk menghindari logout saat user sedang aktif
 */

let lastActivity = Date.now();
const activityListeners: (() => void)[] = [];

// Events yang menunjukkan user activity
const activityEvents = [
  'mousedown',
  'mousemove', 
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

/**
 * Update timestamp aktivitas terakhir
 */
function updateActivity() {
  lastActivity = Date.now();
}

/**
 * Setup activity listeners
 */
function setupActivityTracking() {
  // Add event listeners untuk track activity
  activityEvents.forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });
  
  console.log('👀 Activity tracking started');
}

/**
 * Cleanup activity listeners
 */
function cleanupActivityTracking() {
  activityEvents.forEach(event => {
    document.removeEventListener(event, updateActivity, true);
  });
  
  console.log('👀 Activity tracking stopped');
}

/**
 * Check if user was recently active (within last 2 minutes)
 */
export function isUserRecentlyActive(): boolean {
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  return lastActivity > twoMinutesAgo;
}

/**
 * Initialize activity tracking
 */
export function initActivityTracking() {
  // Setup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupActivityTracking);
  } else {
    setupActivityTracking();
  }
}

/**
 * Cleanup activity tracking
 */
export function destroyActivityTracking() {
  cleanupActivityTracking();
}

// Auto-init if in browser
if (typeof window !== 'undefined') {
  initActivityTracking();
}