import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/store';
import RootNavigator from '@/navigation/RootNavigator';
import { theme } from '@/theme';
import { C } from '@/theme/colors';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { loadRememberMe } from '@/lib/remember-me';

function AppProviders() {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRememberMe()
      .then((saved) => {
        if (cancelled) return;
        if (saved.enabled && saved.session?.accessToken) {
          dispatch(setAuth(saved.session));
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  usePushNotifications();

  if (!ready) {
    return <View style={styles.boot} />;
  }

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
  boot: {
    flex: 1,
    backgroundColor: C.ivory,
  },
  root: {
    flex: 1,
  },
  rootWeb: {
    flex: 1,
    height: '100%',
  },
});
