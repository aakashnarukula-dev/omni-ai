import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { initNotifications, syncSchedules } from '../services/notify';
import { useStore, type TabName } from '../store';

export function NotificationSync() {
  const router = useRouter();

  useEffect(() => {
    void initNotifications().then(() => syncSchedules());

    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { route?: string } | undefined;
      if (!data?.route) return;
      try {
        if (data.route.startsWith('tab:')) {
          const name = data.route.slice(4) as TabName;
          useStore.getState().setTabByName(name);
          router.replace('/(tabs)');
        } else {
          router.push(data.route as never);
        }
      } catch {}
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
