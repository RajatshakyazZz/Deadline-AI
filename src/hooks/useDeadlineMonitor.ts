import { useEffect } from 'react';
import { useApp } from '../components/AppContext';
import { useToast } from './useToast';
import { useNotifications } from './useNotifications';
import { scheduleDeadlineAlerts, triggerDeadlineAlert } from '../utils/deadlineMonitor';

export const useDeadlineMonitor = () => {
  const { tasks } = useApp();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  // Run periodic monitoring check every 60 seconds
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const runChecks = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed) return;

        const deadlineMs = new Date(task.deadline).getTime();
        const minsLeft = Math.floor((deadlineMs - now) / 60000);

        if (minsLeft > 0) {
          // Check exact boundaries: 15m, 1h (60m), 3h (180m), 24h (1440m)
          const thresholds = [1440, 180, 60, 15];
          
          // Trigger if we are close to or at one of these boundaries
          thresholds.forEach((mins) => {
            // If the difference is less than 1.5 minutes (to avoid missing due to 60s intervals)
            if (Math.abs(minsLeft - mins) <= 1) {
              triggerDeadlineAlert(task, mins, showToast, addNotification);
            }
          });
        }
      });
    };

    // Run once on load
    runChecks();

    // Setup schedule of alert setTimeouts
    tasks.forEach((task) => {
      scheduleDeadlineAlerts(task, showToast, addNotification);
    });

    const interval = setInterval(runChecks, 60000); // 60 seconds interval
    return () => clearInterval(interval);
  }, [tasks, showToast, addNotification]);
};
