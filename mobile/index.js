import '@expo/metro-runtime';
import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import App from './App';

if (Platform.OS === 'web') {
  enableScreens(false);
}

// Must be registered outside React lifecycle for killed/background delivery.
// Guard native Firebase so a missing plist / failed FIRApp cannot crash launch.
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseApp = require('@react-native-firebase/app').default;
    if (firebaseApp.apps.length === 0) {
      console.warn('[push] Firebase app not configured; skip background handler');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const messaging = require('@react-native-firebase/messaging').default;
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('[push] Background message', remoteMessage?.messageId);
      });
    }
  } catch (error) {
    console.warn('[push] Failed to register background handler', error);
  }
}

registerRootComponent(App);
