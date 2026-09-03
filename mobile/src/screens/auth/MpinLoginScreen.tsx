import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useLoginWithMpinMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuth } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
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
  const [showMpin, setShowMpin] = useState(false);
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
          <View style={s.footerCol}>
            <View style={s.footer}>
              <Text style={s.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={s.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
            <View style={s.trust}>
              <Icon source="check-decagram" size={16} color={C.gold} />
              <Text style={s.trustText}>BIS Hallmarked • 100% Certified 925 Pure Silver</Text>
            </View>
          </View>
        }
      >
        <Text style={s.fieldLabel}>Email or Mobile</Text>
        <View style={s.inputWrap}>
          <Icon source="email-outline" size={20} color={C.goldDim} />
          <TextInput
            style={s.input}
            placeholder="name@example.com or +91"
            placeholderTextColor={C.textMuted}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={C.gold}
          />
        </View>

        <View style={s.mpinHead}>
          <Text style={[s.fieldLabel, { marginBottom: 0 }]}>6-Digit MPIN</Text>
          <View style={s.vault}>
            <Icon source="shield-check-outline" size={14} color={C.textMuted} />
            <Text style={s.vaultText}>Vault Encrypted</Text>
          </View>
        </View>
        <View style={s.inputWrap}>
          <Icon source="dialpad" size={20} color={C.goldDim} />
          <TextInput
            style={[s.input, s.mpinInput]}
            placeholder="••••••"
            placeholderTextColor={C.textMuted}
            value={mpin}
            onChangeText={(v) => setMpin(digitsOnly(v))}
            keyboardType="number-pad"
            secureTextEntry={!showMpin}
            maxLength={6}
            selectionColor={C.gold}
          />
          <TouchableOpacity onPress={() => setShowMpin((v) => !v)} hitSlop={8}>
            <Icon source={showMpin ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

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

        <View style={s.bioBlock}>
          <View style={s.bioRuleRow}>
            <View style={s.bioRule} />
            <Text style={s.bioLabel}>Or access with</Text>
            <View style={s.bioRule} />
          </View>
          <View style={s.bioBtn}>
            <Icon source="fingerprint" size={26} color={C.goldDim} />
          </View>
        </View>
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
    fontFamily: F.sans,
  },
  mpinHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vault: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vaultText: { color: C.textMuted, fontSize: 11, fontFamily: F.sans },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF2EE',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
    minHeight: 50,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 12,
    fontFamily: F.sans,
  },
  mpinInput: { letterSpacing: 8, fontWeight: '700' },
  btnGap: { marginTop: 8 },
  footerCol: { alignItems: 'center', gap: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.ruby, fontSize: 13, fontWeight: '700' },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { color: C.textMuted, fontSize: 11, fontFamily: F.sans },
  bioBlock: { marginTop: 18, alignItems: 'center' },
  bioRuleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginBottom: 12 },
  bioRule: { flex: 1, height: 1, backgroundColor: C.borderHi },
  bioLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  bioBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
