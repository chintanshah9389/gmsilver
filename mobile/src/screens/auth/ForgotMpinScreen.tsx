import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useResetMpinWithPasswordMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { toAuthIdentifier } from '@/lib/auth-identifier';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function ForgotMpinScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [resetMpin, { isLoading }] = useResetMpinWithPasswordMutation();

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  const onSubmit = async () => {
    if (!identifier.trim() || !password) {
      showSnack('Enter your email or mobile and password.');
      return;
    }
    if (!/^\d{6}$/.test(newMpin)) {
      showSnack('New MPIN must be exactly 6 digits.');
      return;
    }
    if (newMpin !== confirmMpin) {
      showSnack('MPINs do not match.');
      return;
    }
    try {
      await resetMpin({ ...toAuthIdentifier(identifier), password, newMpin, confirmMpin }).unwrap();
      showSnack('MPIN updated. Sign in with your new MPIN.');
      navigation.navigate('MpinLogin');
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to reset MPIN.'));
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
          <Text style={s.brand}>FORGOT MPIN</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Reset MPIN</Text>
          <Text style={s.subheading}>Verify with your password, then set a new 6-digit MPIN</Text>

          <Text style={s.fieldLabel}>Email or Mobile</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com or 9876543210"
            placeholderTextColor={C.textMuted}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={C.silver}
          />

          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Account password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              selectionColor={C.silver}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
              <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.forgot}>Forgot password too? Recover with security question</Text>
          </TouchableOpacity>

          <Text style={s.fieldLabel}>New 6-Digit MPIN</Text>
          <TextInput
            style={s.input}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            value={newMpin}
            onChangeText={(v) => setNewMpin(digitsOnly(v))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            selectionColor={C.silver}
          />

          <Text style={s.fieldLabel}>Confirm MPIN</Text>
          <TextInput
            style={s.input}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            value={confirmMpin}
            onChangeText={(v) => setConfirmMpin(digitsOnly(v))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            selectionColor={C.silver}
          />

          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Set New MPIN</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Remember it? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MpinLogin')}>
            <Text style={s.footerLink}>MPIN Login</Text>
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
  logoWrap: { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  logoBox: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: C.silver, backgroundColor: 'rgba(192,192,192,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: C.silverLt, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  brand: { color: C.silverLt, fontSize: 14, fontWeight: '800', letterSpacing: 5 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 16 },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: 4 },
  eyeText: { fontSize: 16 },
  forgot: { color: C.silver, fontSize: 12, textAlign: 'right', marginBottom: 16 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.silver },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.silver, fontSize: 13, fontWeight: '700' },
});
