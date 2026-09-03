import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import {
  useLookupSecurityQuestionMutation,
  useResetWithSecurityQuestionMutation,
} from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import {
  confirmMpinError,
  confirmPasswordError,
  identifierError,
  mpinError,
  passwordError,
  securityAnswerError,
} from '@/lib/form-validation';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import BrandLogo from '@/components/BrandLogo';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [lookupQuestion, { isLoading: lookingUp }] = useLookupSecurityQuestionMutation();
  const [resetAccount, { isLoading: resetting }] = useResetWithSecurityQuestionMutation();

  const setErr = (key: string, msg: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  };

  const onLookup = async () => {
    const msg = identifierError(identifier);
    setErr('identifier', msg);
    setApiError('');
    if (msg) return;
    try {
      const res = await lookupQuestion(toAuthIdentifier(identifier)).unwrap();
      setQuestion(res.data?.question || '');
    } catch (e) {
      setApiError(getErrorMessage(e, 'No security question found for this account.'));
    }
  };

  const onReset = async () => {
    const next = {
      securityAnswer: securityAnswerError(securityAnswer),
      newPassword: passwordError(newPassword),
      confirmPassword: confirmPasswordError(confirmPassword, newPassword),
      newMpin: mpinError(newMpin),
      confirmMpin: confirmMpinError(confirmMpin, newMpin),
    };
    setErrors(next);
    setApiError('');
    if (Object.values(next).some(Boolean)) return;
    try {
      await resetAccount({
        ...toAuthIdentifier(identifier),
        securityAnswer: securityAnswer.trim(),
        newPassword,
        confirmPassword,
        newMpin,
        confirmMpin,
      }).unwrap();
      navigation.navigate('MpinLogin');
    } catch (e) {
      setApiError(getErrorMessage(e, 'Failed to reset account.'));
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <BrandLogo width={180} />
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Account Recovery</Text>
          <Text style={s.subheading}>
            {question
              ? 'Answer your security question, then set a new password and MPIN'
              : 'Enter your email or mobile to load your security question'}
          </Text>

          {!!apiError && <Text style={s.apiError}>{apiError}</Text>}

          <Text style={s.fieldLabel}>Email or Mobile</Text>
          <TextInput
            style={[s.input, (errors.identifier ? s.inputError : undefined)]}
            placeholder="you@example.com or 9876543210"
            placeholderTextColor={C.textMuted}
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              setApiError('');
              if (question) setQuestion('');
              setErr('identifier', '');
            }}
            onBlur={() => setErr('identifier', identifierError(identifier))}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!question}
            selectionColor={C.gold}
          />
          {errors.identifier ? <Text style={s.errorText}>{errors.identifier}</Text> : <View style={s.spacer} />}

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
                style={[s.input, (errors.securityAnswer ? s.inputError : undefined)]}
                placeholder="Enter your answer"
                placeholderTextColor={C.textMuted}
                value={securityAnswer}
                onChangeText={(v) => { setSecurityAnswer(v); setErr('securityAnswer', ''); }}
                onBlur={() => setErr('securityAnswer', securityAnswerError(securityAnswer))}
                autoCapitalize="none"
                selectionColor={C.gold}
              />
              {errors.securityAnswer ? <Text style={s.errorText}>{errors.securityAnswer}</Text> : <View style={s.spacer} />}

              <Text style={s.fieldLabel}>New Password</Text>
              <View style={s.pwWrap}>
                <TextInput
                  style={[s.input, s.pwInput, (errors.newPassword ? s.inputError : undefined)]}
                  placeholder="Create a password"
                  placeholderTextColor={C.textMuted}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setErr('newPassword', ''); }}
                  onBlur={() => setErr('newPassword', passwordError(newPassword))}
                  secureTextEntry={!showPw}
                  selectionColor={C.gold}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                  <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors.newPassword
                ? <Text style={s.errorText}>{errors.newPassword}</Text>
                : <Text style={s.hint}>Min 8 characters with 1 capital, 1 number and 1 special character</Text>}

              <Text style={s.fieldLabel}>Confirm Password</Text>
              <TextInput
                style={[s.input, (errors.confirmPassword ? s.inputError : undefined)]}
                placeholder="Repeat password"
                placeholderTextColor={C.textMuted}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErr('confirmPassword', ''); }}
                onBlur={() => setErr('confirmPassword', confirmPasswordError(confirmPassword, newPassword))}
                secureTextEntry={!showPw}
                selectionColor={C.gold}
              />
              {errors.confirmPassword ? <Text style={s.errorText}>{errors.confirmPassword}</Text> : <View style={s.spacer} />}

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

              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onReset} disabled={resetting} activeOpacity={0.85}>
                {resetting ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Reset Password & MPIN</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setQuestion(''); setSecurityAnswer(''); setApiError(''); }}>
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
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
  pwWrap: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1, marginRight: 8 },
  eyeBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  eyeText: { color: C.goldDim, fontSize: 13, fontWeight: '700' },
  forgot: { color: C.goldDim, fontSize: 12, textAlign: 'center', marginTop: 14 },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.text, fontSize: 13, fontWeight: '700' },
});
