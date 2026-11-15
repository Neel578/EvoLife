import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Generate a deterministic positive 31-bit integer ID for Android notifications.
 * Fits within Android's 32-bit signed integer ID space (> 0 and <= 2147483647).
 */
export function getNotificationId(taskId) {
  if (typeof taskId === 'number') {
    return (Math.abs(taskId) % 2147483640) + 1;
  }
  const str = String(taskId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 2147483640) + 1;
}

/**
 * Parse time string like "10:00 AM" or "08:30 PM" or "14:15" into 24-hr hour & minute.
 */
export function parseTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') return null;
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/**
 * Format 24-hour hour and minute into "HH:MM AM/PM"
 */
export function formatTimeString(hour24, minute) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Request notification permissions (POST_NOTIFICATIONS on Android 13+)
 * with safe browser fallback.
 */
export async function requestNotificationPermissions() {
  if (!Capacitor.isNativePlatform()) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          return { granted: res === 'granted' };
        } catch {
          return { granted: true };
        }
      }
      return { granted: Notification.permission === 'granted' };
    }
    return { granted: true };
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return { granted: true };
    }
    const req = await LocalNotifications.requestPermissions();
    return { granted: req.display === 'granted' };
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return { granted: false };
  }
}

/**
 * Create a high-importance Android notification channel for habit alarms.
 */
export async function createAlarmChannel() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: 'evolife_alarms',
      name: 'EvoLife Task Alarms',
      description: 'Daily habit reminders and alarm alerts',
      importance: 5, // High importance (sound, heads-up banner & vibration)
      visibility: 1, // Public on lockscreen
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#00D4FF',
    });
  } catch (err) {
    console.warn('Could not create notification channel:', err);
  }
}

/**
 * Schedule a daily repeating alarm notification for a task.
 * @param {string|number} taskId
 * @param {string} taskTitle
 * @param {string} timeString (e.g. "10:00 AM")
 */
export async function scheduleTaskAlarm(taskId, taskTitle, timeString) {
  const parsed = parseTimeString(timeString);
  if (!parsed) {
    console.warn(`[Alarm] Invalid timeString: "${timeString}" for task "${taskTitle}"`);
    return false;
  }

  const notifId = getNotificationId(taskId);
  const title = `⏰ EvoLife: ${taskTitle}`;
  const body = `It's ${timeString} — time for your "${taskTitle}" habit!`;

  if (!Capacitor.isNativePlatform()) {
    console.log(`[Web Preview] Scheduled daily alarm #${notifId} for "${taskTitle}" at ${timeString}`);
    return true;
  }

  try {
    // Cancel existing notification for this task first to avoid duplicates
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch {
      // ignore if none exists
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title,
          body,
          channelId: 'evolife_alarms',
          schedule: {
            on: {
              hour: parsed.hour,
              minute: parsed.minute,
            },
            allowWhileIdle: true, // Fire in Doze mode
            repeats: true,
          },
          sound: 'default',
          extra: {
            taskId,
            taskTitle,
            timeString,
          },
        },
      ],
    });

    console.log(`[Native Alarm] Successfully scheduled #${notifId} for "${taskTitle}" at ${timeString}`);
    return true;
  } catch (err) {
    console.error('Failed to schedule task alarm:', err);
    return false;
  }
}

/**
 * Cancel a scheduled alarm notification for a task.
 * @param {string|number} taskId
 */
export async function cancelTaskAlarm(taskId) {
  const notifId = getNotificationId(taskId);

  if (!Capacitor.isNativePlatform()) {
    console.log(`[Web Preview] Canceled alarm #${notifId} for task ID: ${taskId}`);
    return true;
  }

  try {
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    console.log(`[Native Alarm] Canceled alarm #${notifId}`);
    return true;
  } catch (err) {
    console.warn('Failed to cancel task alarm:', err);
    return false;
  }
}

/**
 * Reschedule all enabled alarms (e.g., on app launch or tasks list refresh).
 * @param {Array} tasks
 */
export async function rescheduleAllAlarms(tasks) {
  if (!Array.isArray(tasks)) return;

  if (Capacitor.isNativePlatform()) {
    await createAlarmChannel();
  }

  for (const task of tasks) {
    if (task && task.alarmEnabled && task.alarmTime) {
      await scheduleTaskAlarm(task.id, task.text || task.title || 'Habit', task.alarmTime);
    } else if (task && task.id) {
      await cancelTaskAlarm(task.id);
    }
  }
}

/**
 * Initialize notification system on app startup.
 */
export async function initNotificationSystem() {
  if (Capacitor.isNativePlatform()) {
    await requestNotificationPermissions();
    await createAlarmChannel();
  }
}
