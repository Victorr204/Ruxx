import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';
import { databases, account, subscribe, Config } from '../../appwriteConfig'; // ✅ use subscribe helper
import { Query } from 'appwrite';
import { registerForPushNotificationsAsync } from '../../utils/notifications';

export default function TabsLayout() {
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  async function savePushToken() {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;

  const user = await account.get();
  // store in a 'userProfiles' collection
  await databases.updateDocument(
    Config.databaseId,
    Config.userProfilesID,
    user.$id,
    { expoPushToken: token }
  );
}

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const user = await account.get();
        const res = await databases.listDocuments(
          Config.databaseId,
          Config.notificationsCollectionId,
          [
            Query.equal('recipientId', user.$id),
            Query.equal('read', false),
          ]
        );
        setUnreadCount(res.total);
      } catch (err) {
        console.log('Unread fetch error:', err.message);
      }
    };

    fetchUnread();

    // ✅ subscribe directly from the client
    const unsub = subscribe(
      `databases.${Config.databaseId}.collections.${Config.notificationsCollectionId}.documents`,
      (response) => {
        if (
          response.events.some((e) =>
            e.includes('.create') || e.includes('.update') || e.includes('.delete')
          )
        ) {
          fetchUnread();
          // ensure push token is saved (keeps savePushToken marked as used)
          savePushToken();
        }
      }
    );

    return () => unsub(); // clean up
  }, []);

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <Tabs
        screenOptions={{
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.subtitle,
    tabBarLabelStyle: { fontSize: 12 },
    tabBarStyle: {
      backgroundColor: theme.background,
      borderTopColor: theme.text,          
      borderTopWidth: 0.5,              
      height: Platform.OS === 'android' ? 60 : 80,
      paddingBottom: Platform.OS === 'android' ? 5 : 20,
    },
    headerShown: false,
  }}
        >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: 'Services',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct-outline" size={size} color={color} />
            ),
          }}
        />

       <Tabs.Screen
  name="notifications"
  options={{
    title: 'Notifications',
    // keep the numeric badge if you still like it:
    // tabBarBadge: unreadCount > 0 ? unreadCount : undefined,

    tabBarIcon: ({ color, size }) => (
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
        style={{
          position: 'relative',
        }}
      >
        {unreadCount > 0 && (
          <SafeAreaView
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'red',
            }}
          />
        )}
      </Ionicons>
    ),
  }}
/>


        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
