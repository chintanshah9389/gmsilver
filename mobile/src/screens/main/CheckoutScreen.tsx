import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useCreateOrderMutation } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';
import ScreenHeader from '@/components/ScreenHeader';
import MotionReveal from '@/components/MotionReveal';
import { useHideTabBarOnFocus } from '@/hooks/useHideTabBarOnFocus';

export default function CheckoutScreen({ navigation }: any) {
  useHideTabBarOnFocus();
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const onPlaceOrder = async () => {
    try {
      await createOrder({ notes }).unwrap();
      navigation.navigate('Order', { screen: 'Orders' });
    } catch (e) {
      setSnackbarMessage(getErrorMessage(e, 'Failed to place order.'));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader title="Checkout" subtitle="Confirm your order" onBack={() => navigation.goBack()} />

      <MotionReveal delay={40} duration={360} distance={14}>
        <View style={styles.card}>
          <Text style={styles.label}>Order notes</Text>
          <Text style={styles.hint}>Optional delivery or billing notes for your team</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Add a note…"
            placeholderTextColor={C.textMuted}
            selectionColor={C.gold}
          />
          <ScalePressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            scaleTo={0.97}
            disabled={isLoading}
            onPress={onPlaceOrder}
          >
            <Text style={styles.btnText}>{isLoading ? 'Placing…' : 'Place Order'}</Text>
          </ScalePressable>
        </View>
      </MotionReveal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    ...E.cardShadow,
  },
  label: { color: C.text, fontSize: 18, fontWeight: '800' },
  hint: { color: C.textMuted, fontSize: 12, marginTop: 6, marginBottom: 14 },
  input: {
    minHeight: 110,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface2,
    padding: 14,
    color: C.text,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 18,
  },
  btn: {
    backgroundColor: C.primary,
    borderRadius: R.pill,
    paddingVertical: 15,
    alignItems: 'center',
    ...E.buttonShadow,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },
});
