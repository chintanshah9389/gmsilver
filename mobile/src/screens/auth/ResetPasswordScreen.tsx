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
import { useResetPasswordMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { toAuthIdentifier } from '@/lib/auth-identifier';

export default function ResetPasswordScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async () => {
    try {
      await resetPassword({
        ...toAuthIdentifier(identifier),
        token,
        newPassword,
        confirmPassword,
      }).unwrap();
      navigation.navigate('ForgotMpin');
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'Password reset failed.'));
      setSnackVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Text style={s.logoText}>GM</Text></View>
          <Text style={s.brand}>RESET PASSWORD</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Set New Password</Text>
          <Text style={s.subheading}>Use the reset token sent to your email</Text>

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
          <Text style={s.fieldLabel}>Reset Token</Text>
          <TextInput
            style={s.input}
            placeholder="Enter reset token"
            placeholderTextColor={C.textMuted}
            value={token}
            onChangeText={setToken}
            selectionColor={C.silver}
          />
          <Text style={s.fieldLabel}>New Password</Text>
          <TextInput
            style={s.input}
            placeholder="Create a password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            selectionColor={C.silver}
          />
          <Text style={s.fieldLabel}>Confirm Password</Text>
          <TextInput
            style={s.input}
            placeholder="Repeat password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            selectionColor={C.silver}
          />
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Reset Password</Text>}
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
  logoWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoBox: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: C.silver, backgroundColor: 'rgba(192,192,192,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoText: { color: C.silverLt, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  brand: { color: C.silverLt, fontSize: 13, fontWeight: '800', letterSpacing: 4 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 14 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnPrimary: { backgroundColor: C.silver },
  btnPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});

