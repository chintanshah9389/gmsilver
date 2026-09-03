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
import { useResetMpinMutation } from '@/store/services/authApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import BrandLogo from '@/components/BrandLogo';
import { toAuthIdentifier } from '@/lib/auth-identifier';

export default function ResetMpinScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [resetMpin, { isLoading }] = useResetMpinMutation();

  const onSubmit = async () => {
    try {
      await resetMpin({ ...toAuthIdentifier(identifier), token, newMpin, confirmMpin }).unwrap();
      navigation.navigate('MpinLogin');
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'MPIN reset failed.'));
      setSnackVisible(true);
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
          <Text style={s.heading}>Set New MPIN</Text>
          <Text style={s.subheading}>Use reset token from your email</Text>

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
          <Text style={s.fieldLabel}>Reset Token</Text>
          <TextInput
            style={s.input}
            placeholder="Enter reset token"
            placeholderTextColor={C.textMuted}
            value={token}
            onChangeText={setToken}
            selectionColor={C.gold}
          />
          <Text style={s.fieldLabel}>New MPIN</Text>
          <TextInput
            style={s.input}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={newMpin}
            onChangeText={setNewMpin}
            selectionColor={C.gold}
          />
          <Text style={s.fieldLabel}>Confirm MPIN</Text>
          <TextInput
            style={s.input}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={confirmMpin}
            onChangeText={setConfirmMpin}
            selectionColor={C.gold}
          />
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Reset MPIN</Text>}
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
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 14 },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});

