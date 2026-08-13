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
import { useLoginWithMpinMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import { getFcmToken, registerDeviceForPush } from '@/services/pushNotifications';
import { toAuthIdentifier } from '@/lib/auth-identifier';
import AuthShell from '@/components/AuthShell';
import ScalePressable from '@/components/ScalePressable';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function MpinLoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [identifier, setIdentifier] = useState('');
  const [mpin, setMpin] = useState('');
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [loginWithMpin, { isLoading }] = useLoginWithMpinMutation();

  const onSubmit = async () => {
    if (!identifier.trim()) {
      setSnackMsg('Enter your email or mobile number.');
      setSnackVisible(true);
      return;
    }
    if (!/^\d{6}$/.test(mpin)) {
      setSnackMsg('MPIN must be exactly 6 digits.');
      setSnackVisible(true);
      return;
    }
    try {
      const fcmToken = await getFcmToken();
      const res = await loginWithMpin({
        ...toAuthIdentifier(identifier),
        mpin,
        ...(fcmToken ? { fcmToken } : {}),
      }).unwrap();
      dispatch(setAuth(res.data));
      if (res.data?.user?.id) {
        void registerDeviceForPush(res.data.user.id);
      }
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'MPIN login failed.'));
      setSnackVisible(true);
    }
  };

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in with email or mobile and your 6-digit MPIN"
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

        <Text style={s.fieldLabel}>6-Digit MPIN</Text>
        <TextInput
          style={s.input}
          placeholder="* * * * * *"
          placeholderTextColor={C.textMuted}
          value={mpin}
          onChangeText={(v) => setMpin(digitsOnly(v))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          selectionColor={C.gold}
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotMpin')}>
          <Text style={s.forgot}>Forgot MPIN?</Text>
        </TouchableOpacity>

        <ScalePressable
          style={[s.btn, s.btnPrimary]}
          scaleTo={0.97}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnPrimaryText}>Sign In</Text>
          )}
        </ScalePressable>

        <ScalePressable
          style={[s.btn, s.btnSecondary]}
          scaleTo={0.97}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={s.btnSecondaryText}>Use password instead</Text>
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
