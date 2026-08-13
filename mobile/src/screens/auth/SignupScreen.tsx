import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSignupMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import SecurityQuestionDropdown from '@/components/SecurityQuestionDropdown';

const digitsOnly = (value: string, max = 6) => value.replace(/\D/g, '').slice(0, max);

export default function SignupScreen({ navigation }: any) {
  const [signup, { isLoading }] = useSignupMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  const onSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showSnack('Please fill in name, email and password.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      showSnack('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(mpin)) {
      showSnack('MPIN must be exactly 6 digits.');
      return;
    }
    if (mpin !== confirmMpin) {
      showSnack('MPINs do not match.');
      return;
    }
    if (!securityQuestion) {
      showSnack('Select a security question.');
      return;
    }
    if (securityAnswer.trim().length < 2) {
      showSnack('Enter an answer for your security question.');
      return;
    }
    try {
      await signup({
        name,
        email,
        phone,
        password,
        mpin,
        confirmMpin,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
      }).unwrap();
      Alert.alert(
        'Account created',
        'Your account is awaiting admin approval. After approval, sign in with your 6-digit MPIN.',
        [{ text: 'OK', onPress: () => navigation.navigate('MpinLogin') }],
      );
    } catch (e) {
      showSnack(getErrorMessage(e, 'Signup failed. Please try again.'));
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.bgCircle} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
          <Text style={s.brand}>GM SILVER</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Create Account</Text>
          <Text style={s.subheading}>Set email, mobile, password and MPIN for login</Text>

          {([
            { label: 'Full Name', value: name, set: setName, placeholder: 'Your full name' },
            { label: 'Email Address', value: email, set: setEmail, placeholder: 'you@example.com', keyboard: 'email-address' as const },
            { label: 'Mobile Number', value: phone, set: setPhone, placeholder: '9876543210', keyboard: 'phone-pad' as const },
          ] as const).map(({ label, value, set, placeholder, keyboard }: any) => (
            <View key={label}>
              <Text style={s.fieldLabel}>{label}</Text>
              <TextInput
                style={s.input}
                placeholder={placeholder}
                placeholderTextColor={C.textMuted}
                value={value}
                onChangeText={set}
                autoCapitalize="none"
                keyboardType={keyboard}
                selectionColor={C.silver}
              />
            </View>
          ))}
          <Text style={s.hint}>You can log in with email or this mobile number</Text>

          <Text style={s.fieldLabel}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Create a password"
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
          <Text style={s.hint}>Used if you forget MPIN. Security question recovers both.</Text>

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
          <Text style={s.hint}>You will always log in with this MPIN</Text>

          <Text style={s.fieldLabel}>Security Question</Text>
          <SecurityQuestionDropdown value={securityQuestion} onChange={setSecurityQuestion} />

          <Text style={s.fieldLabel}>Security Answer</Text>
          <TextInput
            style={s.input}
            placeholder="Your answer"
            placeholderTextColor={C.textMuted}
            value={securityAnswer}
            onChangeText={setSecurityAnswer}
            autoCapitalize="none"
            selectionColor={C.silver}
          />
          <Text style={s.hint}>Used to reset MPIN and password if you forget both</Text>

          <TouchableOpacity style={[s.btn, s.btnPrimary, { marginTop: 24 }]} onPress={onSignup} disabled={isLoading} activeOpacity={0.85}>
            {isLoading
              ? <ActivityIndicator color={C.bg} size="small" />
              : <Text style={s.btnPrimaryText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MpinLogin')}>
            <Text style={s.footerLink}>Sign In with MPIN</Text>
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
  bgCircle: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(192,192,192,0.04)' },

  logoWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoBox: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: C.silver, backgroundColor: 'rgba(192,192,192,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoText: { color: C.silverLt, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  brand: { color: C.silverLt, fontSize: 14, fontWeight: '800', letterSpacing: 5 },

  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },

  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 14 },
  hint: { color: C.textMuted, fontSize: 11, marginTop: -8, marginBottom: 14 },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: 4 },
  eyeText: { fontSize: 16 },

  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.silver },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.silver, fontSize: 13, fontWeight: '700' },
});



