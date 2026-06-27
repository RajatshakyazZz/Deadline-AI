import { Task } from '../types';
import { sendPushNotification } from './pushNotifications';

// In-memory registry to prevent duplicate alerts in current session
const sentAlerts = new Set<string>();

// Get unique key for a task alert at a specific minutes threshold
export function getAlertKey(taskId: string, minsLeft: number): string {
  return `${taskId}_${minsLeft}`;
}

export function triggerDeadlineAlert(
  task: Task,
  minsLeft: number,
  showToast: any,
  addNotificationToDB?: (notif: any) => Promise<void>
) {
  const key = getAlertKey(task.id, minsLeft);
  if (sentAlerts.has(key)) return;
  sentAlerts.add(key);

  let message = `"${task.title}" is due in ${minsLeft} minutes!`;
  let title = '⚡ DeadlineAI Alert';

  if (minsLeft <= 15) {
    title = '🚨 Urgent 15 min left!';
    showToast.crisis(title, message);
    if (addNotificationToDB) {
      addNotificationToDB({
        type: 'crisis',
        title,
        message,
        actionUrl: '/tasks',
        taskId: task.id
      });
    }
  } else if (minsLeft <= 60) {
    title = '🚨 1 Hour Remaining!';
    showToast.crisis(title, message);
    if (addNotificationToDB) {
      addNotificationToDB({
        type: 'crisis',
        title,
        message,
        actionUrl: '/tasks',
        taskId: task.id
      });
    }
  } else if (minsLeft <= 180) {
    title = '🚨 3 Hours Left!';
    showToast.warning(title, message);
    if (addNotificationToDB) {
      addNotificationToDB({
        type: 'crisis',
        title,
        message,
        actionUrl: '/tasks',
        taskId: task.id
      });
    }
  } else {
    title = '⚠️ Tomorrow Deadline';
    message = `"${task.title}" is due in 24 hours.`;
    showToast.info(title, message);
    if (addNotificationToDB) {
      addNotificationToDB({
        type: 'warning',
        title,
        message,
        actionUrl: '/tasks',
        taskId: task.id
      });
    }
  }

  // Dispatch browser native push notification
  sendPushNotification({
    title,
    body: message,
    tag: key,
    urgent: minsLeft <= 60,
    actionUrl: '/tasks'
  });
}

// Schedules future alerts for a single task using setTimeouts
export function scheduleDeadlineAlerts(
  task: Task,
  showToast: any,
  addNotificationToDB?: (notif: any) => Promise<void>
) {
  if (task.completed) return;

  const thresholds = [1440, 180, 60, 15]; // Minutes
  const deadlineMs = new Date(task.deadline).getTime();

  thresholds.forEach((mins) => {
    const alertTime = deadlineMs - mins * 60 * 1000;
    const delay = alertTime - Date.now();

    // If delay is positive, schedule the future alert
    if (delay > 0) {
      setTimeout(() => {
        // Fetch fresh task state to check if it has been completed in the meantime
        triggerDeadlineAlert(task, mins, showToast, addNotificationToDB);
      }, delay);
    } else {
      // If deadline hasn't passed, but we are already past this threshold and alert hasn't been sent yet:
      const timeSinceAlertTime = Date.now() - alertTime;
      const thresholdInMs = mins * 60 * 1000;
      
      // If we are currently inside this window (e.g. past 3h but not past 1h)
      if (delay < 0 && timeSinceAlertTime < thresholdInMs && deadlineMs > Date.now()) {
        const key = getAlertKey(task.id, mins);
        // Only trigger if we haven't fired a smaller threshold already
        if (!sentAlerts.has(key)) {
          triggerDeadlineAlert(task, mins, showToast, addNotificationToDB);
        }
      }
    }
  });
}
