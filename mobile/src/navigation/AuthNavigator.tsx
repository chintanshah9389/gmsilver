import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { C } from '@/theme/colors';
import SplashScreen from '@/screens/auth/SplashScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import MpinLoginScreen from '@/screens/auth/MpinLoginScreen';
import CreateMpinScreen from '@/screens/auth/CreateMpinScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import ForgotMpinScreen from '@/screens/auth/ForgotMpinScreen';
import ResetMpinScreen from '@/screens/auth/ResetMpinScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="MpinLogin" component={MpinLoginScreen} />
      <Stack.Screen name="CreateMpin" component={CreateMpinScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ForgotMpin" component={ForgotMpinScreen} />
      <Stack.Screen name="ResetMpin" component={ResetMpinScreen} />
    </Stack.Navigator>
  );
}
