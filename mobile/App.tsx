import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
      <View style={Platform.OS === 'web' ? styles.rootWeb : styles.root}>
        <SafeAreaProvider style={styles.root}>
          <PaperProvider theme={theme}>
            <AppProviders />
          </PaperProvider>
        </SafeAreaProvider>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootWeb: {
    flex: 1,
    height: '100%',
  },
});
