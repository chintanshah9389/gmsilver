import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import {
  useLookupSecurityQuestionMutation,
  useResetWithSecurityQuestionMutation,
} from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { toAuthIdentifier } from '@/lib/auth-identifier';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function ForgotPasswordScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [question, setQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [lookupQuestion, { isLoading: lookingUp }] = useLookupSecurityQuestionMutation();
  const [resetAccount, { isLoading: resetting }] = useResetWithSecurityQuestionMutation();

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  const onLookup = async () => {
    if (!identifier.trim()) {
      showSnack('Enter your email or mobile number.');
      return;
    }
    try {
      const res = await lookupQuestion(toAuthIdentifier(identifier)).unwrap();
      setQuestion(res.data?.question || '');
    } catch (e) {
      showSnack(getErrorMessage(e, 'No security question found for this account.'));
    }
  };

  const onReset = async () => {
    if (securityAnswer.trim().length < 2) {
      showSnack('Enter your security answer.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnack('Passwords do not match.');
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
      await resetAccount({
        ...toAuthIdentifier(identifier),
        securityAnswer: securityAnswer.trim(),
        newPassword,
        confirmPassword,
        newMpin,
        confirmMpin,
      }).unwrap();
      showSnack('Password and MPIN updated. Sign in with your new MPIN.');
      navigation.navigate('MpinLogin');
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to reset account.'));
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
          <Text style={s.brand}>GM SILVER</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Account Recovery</Text>
          <Text style={s.subheading}>
            {question
              ? 'Answer your security question, then set a new password and MPIN'
              : 'Enter your email or mobile to load your security question'}
          </Text>

          <Text style={s.fieldLabel}>Email or Mobile</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com or 9876543210"
            placeholderTextColor={C.textMuted}
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              if (question) setQuestion('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!question}
            selectionColor={C.silver}
          />

          {!question ? (
            <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onLookup} disabled={lookingUp} activeOpacity={0.85}>
              {lookingUp ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Continue</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <Text style={s.fieldLabel}>Security Question</Text>
              <View style={s.questionBox}>
                <Text style={s.questionText}>{question}</Text>
              </View>

              <Text style={s.fieldLabel}>Your Answer</Text>
              <TextInput
                style={s.input}
                placeholder="Enter your answer"
                placeholderTextColor={C.textMuted}
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                autoCapitalize="none"
                selectionColor={C.silver}
              />

              <Text style={s.fieldLabel}>New Password</Text>
              <View style={s.pwWrap}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Create a password"
                  placeholderTextColor={C.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPw}
                  selectionColor={C.silver}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                  <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Confirm Password</Text>
              <TextInput
                style={s.input}
                placeholder="Repeat password"
                placeholderTextColor={C.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPw}
                selectionColor={C.silver}
              />

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

              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onReset} disabled={resetting} activeOpacity={0.85}>
                {resetting ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Reset Password & MPIN</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setQuestion(''); setSecurityAnswer(''); }}>
                <Text style={s.forgot}>Use a different email or mobile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>Remember it? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MpinLogin')}>
            <Text style={s.footerLink}>Sign In with MPIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>{snackMsg}</Snackbar>
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
  questionBox: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  questionText: { color: C.text, fontSize: 14, lineHeight: 20 },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: 4 },
  eyeText: { fontSize: 16 },
  forgot: { color: C.silver, fontSize: 12, textAlign: 'center', marginTop: 14 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.silver },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.silver, fontSize: 13, fontWeight: '700' },
});
