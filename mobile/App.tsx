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
import {
  clearRememberedSession,
  loadRememberMe,
  persistLogin,
} from '@/lib/remember-me';
import { API_BASE_URL } from '@/store/services/api';

function AppProviders() {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await loadRememberMe();
        if (!saved.enabled || !saved.session?.refreshToken || !saved.session.user) {
          return;
        }

        // Prefer a fresh access token so cart/wishlist work after app reopen.
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: saved.session.refreshToken }),
          });
          if (res.ok) {
            const json = await res.json();
            const tokens = json?.data;
            if (tokens?.accessToken && tokens?.refreshToken) {
              const session = {
                user: saved.session.user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              };
              if (!cancelled) {
                dispatch(setAuth(session));
              }
              await persistLogin({
                remember: true,
                identifier: saved.identifier || saved.session.user.email,
                session,
              });
              return;
            }
          } else {
            await clearRememberedSession();
            return;
          }
        } catch {
          // Network error — fall through to stored access token if present.
        }

        if (!cancelled && saved.session.accessToken) {
          dispatch(setAuth(saved.session));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

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
