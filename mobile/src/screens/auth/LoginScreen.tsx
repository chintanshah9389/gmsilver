import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLoginMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import { getFcmToken, registerDeviceForPush } from '@/services/pushNotifications';
import { toAuthIdentifier } from '@/lib/auth-identifier';
import AuthShell from '@/components/AuthShell';
import ScalePressable from '@/components/ScalePressable';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const onLogin = async () => {
    if (!identifier.trim()) {
      setSnackMsg('Enter your email or mobile number.');
      setSnackVisible(true);
      return;
    }
    try {
      const fcmToken = await getFcmToken();
      const res = await login({
        ...toAuthIdentifier(identifier),
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
    <>
      <AuthShell
        title="Password login"
        subtitle="Use this if you forgot your MPIN, then reset it"
        footer={
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={s.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <Text style={s.fieldLabel}>Email or Mobile</Text>
        <TextInput
          style={s.input}
          placeholder="you@example.com or 9876543210"
          placeholderTextColor={C.textMuted}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          selectionColor={C.gold}
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
            selectionColor={C.gold}
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
            <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={s.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        <ScalePressable
          style={[s.btn, s.btnPrimary]}
          scaleTo={0.97}
          onPress={onLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnPrimaryText}>Sign In with Password</Text>
          )}
        </ScalePressable>

        <ScalePressable
          style={[s.btn, s.btnSecondary]}
          scaleTo={0.97}
          onPress={() => navigation.navigate('MpinLogin')}
        >
          <Text style={s.btnSecondaryText}>Back to MPIN login</Text>
        </ScalePressable>
      </AuthShell>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </>
  );
}

const s = StyleSheet.create({
  fieldLabel: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 16,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: 4 },
  eyeText: { color: C.goldDim, fontSize: 12, fontWeight: '700' },
  forgot: { color: C.goldDim, fontSize: 12, textAlign: 'right', marginBottom: 16 },
  btn: { borderRadius: R.pill, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.text, ...E.buttonShadow },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  btnSecondary: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
  btnSecondaryText: { color: C.textSub, fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.goldDim, fontSize: 13, fontWeight: '700' },
});
