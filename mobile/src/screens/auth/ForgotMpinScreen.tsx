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
import { useResetMpinWithPasswordMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { confirmMpinError, identifierError, mpinError } from '@/lib/form-validation';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [resetMpin, { isLoading }] = useResetMpinWithPasswordMutation();

  const setErr = (key: string, msg: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  };

  const onSubmit = async () => {
    const next = {
      identifier: identifierError(identifier),
      password: password ? '' : 'Password is required',
      newMpin: mpinError(newMpin),
      confirmMpin: confirmMpinError(confirmMpin, newMpin),
    };
    setErrors(next);
    setApiError('');
    if (Object.values(next).some(Boolean)) return;
    try {
      await resetMpin({ ...toAuthIdentifier(identifier), password, newMpin, confirmMpin }).unwrap();
      navigation.navigate('MpinLogin');
    } catch (e) {
      setApiError(getErrorMessage(e, 'Failed to reset MPIN.'));
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

          {!!apiError && <Text style={s.apiError}>{apiError}</Text>}

          <Text style={s.fieldLabel}>Email or Mobile</Text>
          <TextInput
            style={[s.input, (errors.identifier ? s.inputError : undefined)]}
            placeholder="you@example.com or 9876543210"
            placeholderTextColor={C.textMuted}
            value={identifier}
            onChangeText={(v) => { setIdentifier(v); setErr('identifier', ''); setApiError(''); }}
            onBlur={() => setErr('identifier', identifierError(identifier))}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={C.gold}
          />
          {errors.identifier ? <Text style={s.errorText}>{errors.identifier}</Text> : <View style={s.spacer} />}

          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, s.pwInput, (errors.password ? s.inputError : undefined)]}
              placeholder="Account password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setErr('password', ''); setApiError(''); }}
              onBlur={() => setErr('password', password ? '' : 'Password is required')}
              secureTextEntry={!showPw}
              selectionColor={C.gold}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
              <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : <View style={s.spacer} />}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.forgot}>Forgot password too? Recover with security question</Text>
          </TouchableOpacity>

          <Text style={s.fieldLabel}>New 6-Digit MPIN</Text>
          <TextInput
            style={[s.input, (errors.newMpin ? s.inputError : undefined)]}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            value={newMpin}
            onChangeText={(v) => { setNewMpin(digitsOnly(v)); setErr('newMpin', ''); }}
            onBlur={() => setErr('newMpin', mpinError(newMpin))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            selectionColor={C.gold}
          />
          {errors.newMpin ? <Text style={s.errorText}>{errors.newMpin}</Text> : <Text style={s.hint}>Exactly 6 numbers</Text>}

          <Text style={s.fieldLabel}>Confirm MPIN</Text>
          <TextInput
            style={[s.input, (errors.confirmMpin ? s.inputError : undefined)]}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            value={confirmMpin}
            onChangeText={(v) => { setConfirmMpin(digitsOnly(v)); setErr('confirmMpin', ''); }}
            onBlur={() => setErr('confirmMpin', confirmMpinError(confirmMpin, newMpin))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            selectionColor={C.gold}
          />
          {errors.confirmMpin ? <Text style={s.errorText}>{errors.confirmMpin}</Text> : <View style={s.spacer} />}

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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  logoBox: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: C.gold, backgroundColor: 'rgba(192,192,192,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  brand: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 5 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, lineHeight: 18, marginBottom: 20 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14 },
  inputError: { borderColor: C.error },
  errorText: { color: C.error, fontSize: 12, lineHeight: 16, marginTop: 6, marginBottom: 12 },
  hint: { color: C.textMuted, fontSize: 11, lineHeight: 15, marginTop: 6, marginBottom: 12 },
  spacer: { height: 12 },
  apiError: { color: C.error, fontSize: 13, lineHeight: 18, fontWeight: '600', marginBottom: 14 },
  pwWrap: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1, marginRight: 8 },
  eyeBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  eyeText: { color: C.goldDim, fontSize: 13, fontWeight: '700' },
  forgot: { color: C.goldDim, fontSize: 12, lineHeight: 16, textAlign: 'right', marginBottom: 16 },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.text },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.goldDim, fontSize: 13, fontWeight: '700' },
});
