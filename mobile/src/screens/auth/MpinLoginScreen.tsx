import React, { useEffect, useState } from 'react';
import {
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
import { C } from '@/theme/colors';
import { getFcmToken, registerDeviceForPush } from '@/services/pushNotifications';
import { toAuthIdentifier } from '@/lib/auth-identifier';
import { loadRememberMe, persistLogin } from '@/lib/remember-me';
import AuthShell from '@/components/AuthShell';
import GradientButton from '@/components/GradientButton';
import RememberMeRow from '@/components/RememberMeRow';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function MpinLoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [identifier, setIdentifier] = useState('');
  const [mpin, setMpin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [loginWithMpin, { isLoading }] = useLoginWithMpinMutation();

  useEffect(() => {
    loadRememberMe().then((saved) => {
      if (saved.enabled && saved.identifier) {
        setIdentifier(saved.identifier);
        setRememberMe(true);
      }
    });
  }, []);

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
      await persistLogin({
        remember: rememberMe,
        identifier,
        session: res.data,
      });
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

        <RememberMeRow
          checked={rememberMe}
          onToggle={() => setRememberMe((v) => !v)}
          forgotLabel="Forgot MPIN?"
          onForgot={() => navigation.navigate('ForgotMpin')}
        />

        <GradientButton
          label="Sign In"
          onPress={onSubmit}
          loading={isLoading}
          style={s.btnGap}
        />

        <GradientButton
          label="Use password instead"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={s.btnGap}
        />
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: C.text,
    fontSize: 14,
    marginBottom: 16,
  },
  btnGap: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.primaryDim, fontSize: 13, fontWeight: '700' },
});
