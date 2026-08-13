import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import {
  useOrderByIdQuery,
  useCancelOrderMutation,
} from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import MotionReveal from '@/components/MotionReveal';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

const STATUS_COLOR: Record<string, string> = {
  PENDING: C.warning,
  APPROVED: C.success,
  COMPLETED: C.silver,
  REJECTED: C.error,
  CANCELLED: C.error,
};

function formatMoney(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { data, error, isError, isLoading } = useOrderByIdQuery(orderId);
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const order = data?.data;

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load order details.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  const showSnack = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const onCancel = async () => {
    try {
      await cancel(order.id).unwrap();
      showSnack('Order cancelled.');
    } catch (e) {
      showSnack(getErrorMessage(e, 'Failed to cancel order.'));
    }
  };

  if (isLoading || !order) {
    return (
      <View style={s.root}>
        <PremiumBackground />
        <ScreenHeader title="Order" subtitle="Loading" onBack={() => navigation.goBack()} />
        <View style={s.loader}>
          <ActivityIndicator color={C.silver} />
        </View>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[order.status] ?? C.textMuted;
  const items: any[] = order.items || [];
  const invoice = order.invoice;

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title={order.orderNumber}
        subtitle={new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
        onBack={() => navigation.goBack()}
        right={
          <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{order.status}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <MotionReveal delay={40} duration={320} distance={10}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Items</Text>
            {items.map((item, index) => {
              const image = item.product?.image1Url || item.product?.imageUrl;
              return (
                <View key={item.id} style={[s.itemRow, index < items.length - 1 && s.itemDivider]}>
                  {image ? (
                    <Image source={{ uri: image }} style={s.thumb} />
                  ) : (
                    <View style={s.thumbPlaceholder}>
                      <Text style={s.thumbInitial}>{item.product?.name?.[0] ?? '?'}</Text>
                    </View>
                  )}
                  <View style={s.itemCopy}>
                    <Text style={s.itemName} numberOfLines={2}>{item.product?.name}</Text>
                    <Text style={s.itemMeta}>Qty {item.quantity}  ·  {formatMoney(item.rate)}</Text>
                  </View>
                  <Text style={s.itemAmount}>{formatMoney(item.amount ?? Number(item.rate) * Number(item.quantity))}</Text>
                </View>
              );
            })}
          </View>
        </MotionReveal>

        <MotionReveal delay={90} duration={320} distance={10}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Summary</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>{formatMoney(order.totalAmount)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>GST</Text>
              <Text style={s.summaryValue}>{formatMoney(order.gstAmount)}</Text>
            </View>
            <View style={[s.summaryRow, s.summaryTotal]}>
              <Text style={s.totalLabel}>Grand total</Text>
              <Text style={s.totalValue}>{formatMoney(order.grandTotal)}</Text>
            </View>
            {order.notes ? (
              <Text style={s.notes}>Notes: {order.notes}</Text>
            ) : null}
          </View>
        </MotionReveal>

        {invoice?.pdfUrl ? (
          <MotionReveal delay={120} duration={320} distance={10}>
            <ScalePressable
              style={s.invoiceBtn}
              scaleTo={0.98}
              onPress={() => Linking.openURL(invoice.pdfUrl)}
            >
              <Icon source="file-pdf-box" size={18} color={C.text} />
              <Text style={s.invoiceBtnText}>Open invoice {invoice.invoiceNumber || ''}</Text>
            </ScalePressable>
          </MotionReveal>
        ) : null}

        {order.status === 'PENDING' ? (
          <MotionReveal delay={150} duration={320} distance={10}>
            <ScalePressable style={s.cancelBtn} scaleTo={0.98} onPress={onCancel} disabled={cancelling}>
              {cancelling ? (
                <ActivityIndicator color={C.error} />
              ) : (
                <Text style={s.cancelBtnText}>Cancel order</Text>
              )}
            </ScalePressable>
          </MotionReveal>
        ) : null}
      </ScrollView>

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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  sectionTitle: {
    color: C.silver,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.surface2 },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitial: { color: C.textMuted, fontSize: 16, fontWeight: '700' },
  itemCopy: { flex: 1, minWidth: 0 },
  itemName: { color: C.text, fontSize: 13, fontWeight: '700' },
  itemMeta: { color: C.textMuted, fontSize: 11, marginTop: 3 },
  itemAmount: { color: C.text, fontSize: 13, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: C.textSub, fontSize: 13 },
  summaryValue: { color: C.text, fontSize: 13, fontWeight: '600' },
  summaryTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginBottom: 0,
  },
  totalLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
  totalValue: { color: C.silver, fontSize: 17, fontWeight: '800' },
  notes: { color: C.textMuted, fontSize: 12, marginTop: 12, lineHeight: 18 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    ...E.softShadow,
  },
  invoiceBtnText: { color: C.text, fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.error,
    backgroundColor: 'rgba(201,125,138,0.08)',
  },
  cancelBtnText: { color: C.error, fontSize: 14, fontWeight: '700' },
});
