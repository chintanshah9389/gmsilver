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
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[push] Background message', remoteMessage?.messageId);
  });
}

registerRootComponent(App);
