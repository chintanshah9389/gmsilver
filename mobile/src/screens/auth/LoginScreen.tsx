import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLoginMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import { getFcmToken, registerDeviceForPush } from '@/services/pushNotifications';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const onLogin = async () => {
    try {
      const fcmToken = await getFcmToken();
      const res = await login({
        email,
        password,
        ...(fcmToken ? { fcmToken } : {}),
      }).unwrap();
      dispatch(setAuth(res.data));
      if (res.data?.user?.id) {
        void registerDeviceForPush(res.data.user.id);
      }
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'Login failed. Please try again.'));
      setSnackVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" shimmer />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Background decoration */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>GM</Text>
          </View>
          <Text style={s.brand}>GM SILVER</Text>
          <Text style={s.tagline}>B2B Silver Catalog</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.heading}>Welcome Back</Text>
          <Text style={s.subheading}>Sign in to continue</Text>

          <Text style={s.fieldLabel}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor={C.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={C.silver}
          />

          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="********"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              selectionColor={C.silver}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
              <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onLogin} disabled={isLoading} activeOpacity={0.85}>
            {isLoading
              ? <ActivityIndicator color={C.bg} size="small" />
              : <Text style={s.btnPrimaryText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => navigation.navigate('MpinLogin')} activeOpacity={0.85}>
            <Text style={s.btnSecondaryText}>Login with MPIN</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={s.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  bgCircle1: { position: 'absolute', top: -120, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(192,192,192,0.05)' },
  bgCircle2: { position: 'absolute', bottom: 80, left: -100, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,215,0,0.04)' },

  logoWrap: { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  logoBox: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, borderColor: C.silver,
    backgroundColor: 'rgba(192,192,192,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { color: C.silverLt, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  brand: { color: C.silverLt, fontSize: 17, fontWeight: '800', letterSpacing: 5.4 },
  tagline: { color: C.textSub, fontSize: 11, letterSpacing: 2.1, marginTop: 5 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    ...E.cardShadow,
  },
  heading: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },

  fieldLabel: { color: C.textSub, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 14, marginBottom: 16,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: 4 },
  eyeText: { fontSize: 16 },
  forgot: { color: C.silver, fontSize: 12, textAlign: 'right', marginBottom: 20 },

  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.silver, ...E.buttonShadow },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  btnSecondary: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
  btnSecondaryText: { color: C.textSub, fontSize: 14, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.silver, fontSize: 13, fontWeight: '700' },
});



