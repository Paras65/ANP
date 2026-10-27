/**
 * Ambition News Portal - Breaking News Push Notification Utility
 * Handles Web Notifications API & Real-time cross-tab BroadcastChannel
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function sendBreakingPushNotification(
  title: string, 
  body: string, 
  district: string = 'छत्तीसगढ़'
): Promise<boolean> {
  // 1. Cross-tab real-time sync via BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('anp_breaking_alerts');
      channel.postMessage({
        title,
        body,
        district,
        timestamp: Date.now()
      });
      channel.close();
    }
    // Fallback localStorage trigger
    localStorage.setItem('anp_last_breaking_push', JSON.stringify({
      title,
      body,
      district,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn('[BroadcastChannel Error]:', err);
  }

  // 2. Native System / Browser Notification
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  try {
    const notification = new Notification(`🔴 AMBITION NEWS • ${district}`, {
      body: title || body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'anp-breaking-alert',
      vibrate: [200, 100, 200]
    } as any);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('[Push Notification Trigger Failed]:', err);
    return false;
  }
}

