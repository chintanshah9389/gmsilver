import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import MotionReveal from '@/components/MotionReveal';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';
import { getErrorMessage } from '@/lib/error-message';
import {
  useChangeMpinMutation,
  useChangePasswordMutation,
} from '@/store/services/authApi';

export default function SettingsScreen({ navigation }: any) {
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();
  const [changeMpin, { isLoading: savingMpin }] = useChangeMpinMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  const onSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      showSnack('New passwords do not match.');
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnack('Password updated.');
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to change password.'));
    }
  };

  const onSaveMpin = async () => {
    if (newMpin !== confirmMpin) {
      showSnack('New MPINs do not match.');
      return;
    }
    try {
      await changeMpin({ currentMpin, newMpin, confirmMpin }).unwrap();
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      showSnack('MPIN updated.');
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to change MPIN.'));
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="Settings"
        subtitle="Password, MPIN & security"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionReveal delay={40} duration={320} distance={10}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>CHANGE PASSWORD</Text>
            <Text style={s.fieldLabel}>Current password</Text>
            <TextInput
              style={s.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <Text style={s.fieldLabel}>New password</Text>
            <TextInput
              style={s.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <Text style={s.fieldLabel}>Confirm password</Text>
            <TextInput
              style={s.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm password"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <ScalePressable style={s.saveBtn} scaleTo={0.98} onPress={onSavePassword} disabled={savingPassword}>
              {savingPassword
                ? <ActivityIndicator color={C.bg} />
                : <Text style={s.saveBtnText}>Update password</Text>}
            </ScalePressable>
          </View>
        </MotionReveal>

        <MotionReveal delay={90} duration={320} distance={10}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>CHANGE MPIN</Text>
            <Text style={s.hint}>Daily app login uses this 6-digit MPIN</Text>
            <Text style={s.fieldLabel}>Current MPIN</Text>
            <TextInput
              style={s.input}
              value={currentMpin}
              onChangeText={setCurrentMpin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              placeholder="* * * * * *"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <Text style={s.fieldLabel}>New MPIN</Text>
            <TextInput
              style={s.input}
              value={newMpin}
              onChangeText={setNewMpin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              placeholder="* * * * * *"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <Text style={s.fieldLabel}>Confirm MPIN</Text>
            <TextInput
              style={s.input}
              value={confirmMpin}
              onChangeText={setConfirmMpin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              placeholder="* * * * * *"
              placeholderTextColor={C.textMuted}
              selectionColor={C.silver}
            />
            <ScalePressable style={s.saveBtn} scaleTo={0.98} onPress={onSaveMpin} disabled={savingMpin}>
              {savingMpin
                ? <ActivityIndicator color={C.bg} />
                : <Text style={s.saveBtnText}>Update MPIN</Text>}
            </ScalePressable>
          </View>
        </MotionReveal>
      </ScrollView>
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  sectionTitle: {
    color: C.silver,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 14,
  },
  fieldLabel: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hint: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 14,
  },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: C.silver,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    ...E.buttonShadow,
  },
  saveBtnText: { color: C.bg, fontSize: 14, fontWeight: '700', letterSpacing: 0.4 },
});
