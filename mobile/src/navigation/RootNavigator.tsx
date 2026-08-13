import React from 'react';
import { Platform } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import CreateMpinScreen from '@/screens/auth/CreateMpinScreen';
import { C } from '@/theme/colors';
import { linking, navigationRef } from './navigationRef';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.bg,
    card: C.bg,
    text: C.text,
    border: C.border,
    primary: '#87A9D9',
  },
};

export default function RootNavigator() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const hasMpin = useSelector((state: RootState) => state.auth.user?.hasMpin);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={Platform.OS === 'web' ? undefined : linking}
      theme={navTheme}
    >
      {isAuthenticated
        ? hasMpin === false
          ? <CreateMpinScreen />
          : <AppNavigator />
        : <AuthNavigator />}
    </NavigationContainer>
  );
}
