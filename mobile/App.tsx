import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/store';
import RootNavigator from '@/navigation/RootNavigator';
import { theme } from '@/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function AppProviders() {
  usePushNotifications();

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppProviders />
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
