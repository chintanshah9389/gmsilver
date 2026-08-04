import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Must be registered outside React lifecycle for killed/background delivery.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[push] Background message', remoteMessage?.messageId);
  });
}

// Expo / MainActivity expects the component name "main"
AppRegistry.registerComponent('main', () => App);
