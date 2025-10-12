// components/PushNotificationSetup.jsx
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications'; 

export default function PushNotificationSetup() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return null; // it's a background setup component
}
