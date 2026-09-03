import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useCreateOrderMutation } from '@/store/services/ordersApi';
import { useCartQuery } from '@/store/services/cartApi';
import { useAppSelector } from '@/hooks/redux';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import { E } from '@/theme/effects';
import ScreenHeader from '@/components/ScreenHeader';
import { useHideTabBarOnFocus } from '@/hooks/useHideTabBarOnFocus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckoutScreen({ navigation }: any) {
  useHideTabBarOnFocus();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((st) => st.auth.user);
  const { data } = useCartQuery();
  const items: any[] = data?.data?.items || [];
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const onPlaceOrder = async () => {
    try {
      await createOrder({ notes: notes.trim() || undefined }).unwrap();
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
      <ScreenHeader title="Confirm order" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => {
          const product = item.product || {};
          const facts = [
            product.sku,
            product.purity,
            product.weight != null && product.weight !== ''
              ? `${product.weight} g`
              : null,
            item.unit === 'KG'
              ? `${Number(item.unitAmount || 0)} kg · ${item.quantity} pcs`
              : `${item.quantity} pcs`,
          ].filter(Boolean);

          return (
            <View key={item.id} style={styles.item}>
              {product.image1Url ? (
                <Image
                  source={{ uri: product.image1Url }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbPh} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.prodName} numberOfLines={2}>
                  {product.name}
                </Text>
                {facts.length ? (
                  <Text style={styles.facts} numberOfLines={2}>
                    {facts.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {(user?.email || user?.phone || user?.name) ? (
          <View style={styles.card}>
            {user?.name ? <Text style={styles.contactVal}>{user.name}</Text> : null}
            {user?.email ? <Text style={styles.contactSub}>{user.email}</Text> : null}
            {user?.phone ? <Text style={styles.contactSub}>{user.phone}</Text> : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.notesTitle}>Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Optional"
            placeholderTextColor={C.textMuted}
            selectionColor={C.gold}
          />
        </View>
      </ScrollView>

      {items.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            disabled={isLoading}
            onPress={onPlaceOrder}
          >
            <Text style={styles.btnText}>{isLoading ? 'Placing…' : 'Place Order'}</Text>
          </Pressable>
        </View>
      ) : null}

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
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    ...E.softShadow,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.bg2 },
  thumbPh: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.bg2 },
  prodName: { color: C.text, fontSize: 15, fontFamily: F.serif, fontWeight: '600' },
  facts: { color: C.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
    ...E.softShadow,
  },
  contactVal: { color: C.text, fontSize: 15, fontWeight: '700' },
  contactSub: { color: C.textSub, fontSize: 13, marginTop: 3 },
  notesTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  input: {
    minHeight: 88,
    borderRadius: 12,
    backgroundColor: C.bg2,
    padding: 12,
    color: C.text,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: C.borderHi,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  btn: {
    backgroundColor: C.ruby,
    borderRadius: R.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },
});
