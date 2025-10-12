import { useEffect, useState,  useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { account, databases, Config } from '../appwriteConfig';
import { Query } from 'appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Modal, View, Text , BackHandler, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
import PushNotificationSetup from './PushNotificationSetup';
import { ThemeProvider, useTheme } from '../context/ThemeContext'; 
import NetInfo from "@react-native-community/netinfo";

import "../global.css";


function AppWrapper() {
  const { theme } = useTheme();

  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const lastBackPressed = useRef(0);
  const [showLanding, setShowLanding] = useState(false);


   // ✅ Double back to exit
  useEffect(() => {
  const onBackPress = () => {
    // Only apply exit on dashboard / home / main tabs
    const mainRoutes = ["/", "/dashboard", "/(tabs)/home"];
    if (mainRoutes.includes(pathname)) {
      const now = Date.now();
      if (lastBackPressed.current && now - lastBackPressed.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressed.current = now;
      if (Platform.OS === "android") {
        ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      }
      return true;
    }

    // ✅ Only go back if router has history
    if (router.canGoBack?.()) {
      router.back();
      return true;
    }

    return false; // let system handle it (avoids warning)
  };

  const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
  return () => subscription.remove();
}, [pathname]);



  
  // network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // check pin status
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const session = await account.get();

        if (!session.emailVerification) {
          setChecking(false);
          return;
        }

        const userDocs = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [Query.equal('userId', session.$id)]
        );

        if (!userDocs.total) {
          setChecking(false);
          return;
        }

        const userDoc = userDocs.documents[0];
        const pin = userDoc.pin;
        const pinVerified = await AsyncStorage.getItem('pinVerified');
        const skipPinSetup = await AsyncStorage.getItem('skipPinSetup');

        if (!pin && pathname !== '/set-pin' && pathname !== '/ask-pin' && skipPinSetup !== 'true') {
          router.replace('/ask-pin');
        } else if (pin && pinVerified !== 'true' && pathname !== '/verify-pin') {
          router.replace('/verify-pin');
        }

      } catch (err) {
        console.log('Session check error', err.message);
      } finally {
        setChecking(false);
      }
    };

    checkPinStatus();
  }, [pathname]);


  
// landing page once for new uers
useEffect(() => {
  const checkLanding = async () => {
    const seen = await AsyncStorage.getItem("hasSeenLanding");
    if (!seen) {
      setShowLanding(true);  // first time → show landing
      await AsyncStorage.setItem("hasSeenLanding", "true");
    }
  };
  checkLanding();
}, []);


 // Clear pin ONLY when app is launched from a cold start
useEffect(() => {
  // runs once on fresh launch
  const clearOnLaunch = async () => {
    await AsyncStorage.removeItem('pinVerified');
  };
  clearOnLaunch();
}, []);


  if (checking) return null;

  return (
    <>
    <PushNotificationSetup />

     {/* Offline modal */}
      {!isConnected && (
        <Modal transparent animationType="fade" visible={!isConnected}>
          <View style={styles.overlay}>
            <View style={styles.banner}>
              <Text style={styles.text}>⚠️ No Internet Connection</Text>
              <Text style={styles.subText}>Please connect to continue</Text>
            </View>
          </View>
        </Modal>
      )} 
      
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>      

       {/* ✅ Wrap routes in a Stack so back works correctly */}
      <Stack
  screenOptions={{
     headerShown: Platform.OS === "ios",  // ✅ Only show header/back arrow on iOS
    headerBackTitleVisible: false, // optional: hide the “Back” text on iOS
    headerStyle: { backgroundColor: theme.background },
  headerTintColor: theme.text, 
  }}
>
        
  {/* Landing only shows if first time */}
  {showLanding && <Stack.Screen name="index" options={{ headerShown: false }} />}
  <Stack.Screen name="login" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

  {/* Pages that should have the native back arrow */}
  <Stack.Screen name="airtimePage" />
  <Stack.Screen name="dataPage" />
  <Stack.Screen name="ElectricityPage" />
  <Stack.Screen name="TVPage" />
  <Stack.Screen name="GiftCardPage" />
  <Stack.Screen name="SubscriptionPage" />
  <Stack.Screen name="BettingPage" />
  <Stack.Screen name="SupportChat" />

  <Stack.Screen name="set-pin" options={{ headerShown: false }} />
  <Stack.Screen name="ask-pin" options={{ headerShown: false }} />
  <Stack.Screen name="verify-pin" options={{ headerShown: false }} />

</Stack>
    </SafeAreaView>

    
    </>
    
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <AppWrapper/>
      </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  banner: {
    backgroundColor: "#ff4444",
    padding: 20,
    borderRadius: 10,
  },
  text: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  subText: { color: "#fff", marginTop: 5 },
});
