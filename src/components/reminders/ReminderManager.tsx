import { useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import { useToast } from '../ui/ToastProvider';

interface ImportantDay {
  id: number;
  title: string;
  date: string;
  repeat_yearly: boolean;
}

interface ImportantDaysResponse {
  days: ImportantDay[];
}

const ReminderManager = () => {
  const { addToast } = useToast();

  const sendNotification = useCallback((day: ImportantDay, diffDays: number) => {
    const title = `Upcoming: \${day.title}`;
    let body = '';

    if (diffDays === 0) body = `It's happening today!`;
    else if (diffDays === 1) body = `Tomorrow!`;
    else body = `In \${diffDays} days.`;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/icon-192.png' // Assuming icon exists
      });
    } else {
      // Fallback to toast
      addToast(`\${title} - \${body}`, 'info');
    }
  }, [addToast]);

  useEffect(() => {
    const checkReminders = async () => {
      try {
        // Request permission if not denied
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        const response: ImportantDaysResponse = await apiService.getImportantDays();
        const days = response.days || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        days.forEach(day => {
          const nextDate = getNextOccurrence(day, today);
          const diffTime = nextDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Notify if within 3 days (0 = today, 1 = tomorrow, etc)
          if (diffDays >= 0 && diffDays <= 3) {
            const notificationKey = `twilightio_reminder_\${day.id}_\${nextDate.getFullYear()}`;
            const alreadySent = localStorage.getItem(notificationKey);

            if (!alreadySent) {
              sendNotification(day, diffDays);
              localStorage.setItem(notificationKey, 'true');
            }
          }
        });
      } catch (err) {
        console.error('Failed to check reminders:', err);
      }
    };

    checkReminders();
  }, [addToast, sendNotification]);

  return null;
};

const getNextOccurrence = (day: ImportantDay, today: Date): Date => {
  const dateParts = day.date.split('-'); // YYYY-MM-DD
  const month = parseInt(dateParts[1], 10) - 1;
  const dom = parseInt(dateParts[2], 10);

  const currentYear = today.getFullYear();
  let occurrence = new Date(currentYear, month, dom);

  if (day.repeat_yearly) {
    if (occurrence < today) {
      occurrence.setFullYear(currentYear + 1);
    }
  } else {
    occurrence = new Date(day.date);
  }

  return occurrence;
};

export default ReminderManager;
