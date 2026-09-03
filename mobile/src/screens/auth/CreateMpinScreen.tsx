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
import { useCreateMpinMutation } from '@/store/services/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setHasMpin } from '@/store/slices/authSlice';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import BrandLogo from '@/components/BrandLogo';

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export default function CreateMpinScreen() {
  const dispatch = useAppDispatch();
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [createMpin, { isLoading }] = useCreateMpinMutation();

  const onSave = async () => {
    if (!/^\d{6}$/.test(mpin)) {
      setSnackMsg('MPIN must be exactly 6 digits.');
      setSnackVisible(true);
      return;
    }
    if (mpin !== confirmMpin) {
      setSnackMsg('MPINs do not match.');
      setSnackVisible(true);
      return;
    }
    try {
      await createMpin({ mpin, confirmMpin }).unwrap();
      dispatch(setHasMpin(true));
    } catch (e) {
      setSnackMsg(getErrorMessage(e, 'Failed to create MPIN.'));
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
          <Text style={s.brand}>CREATE MPIN</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Set your MPIN</Text>
          <Text style={s.subheading}>A 6-digit MPIN is required for app login</Text>

          <Text style={s.fieldLabel}>New MPIN</Text>
          <TextInput
            style={s.input}
            placeholder="* * * * * *"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={mpin}
            onChangeText={(v) => setMpin(digitsOnly(v))}
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
            onChangeText={(v) => setConfirmMpin(digitsOnly(v))}
            selectionColor={C.gold}
          />

          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSave} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.btnPrimaryText}>Save MPIN</Text>}
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
  brand: { color: C.goldDim, fontSize: 14, fontWeight: '800', letterSpacing: 5, marginTop: 12 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textSub, fontSize: 13, marginBottom: 24 },
  fieldLabel: { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 16 },
  btn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});

