import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useForgotPasswordMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async () => {
    try {
      const res = await forgotPassword({ email }).unwrap();
      navigation.navigate('ResetPassword', { email, token: res.data?.resetToken });
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'Failed to send reset token.'));
      setSnackVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
          <Text style={s.brand}>GM SILVER</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Forgot Password?</Text>
          <Text style={s.subheading}>Enter your email and we'll send a reset token</Text>
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
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Send Reset Token</Text>}
          </TouchableOpacity>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>Remember it? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.footerLink}>Sign In</Text>
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
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.silver },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: C.textSub, fontSize: 13 },
  footerLink: { color: C.silver, fontSize: 13, fontWeight: '700' },
});
