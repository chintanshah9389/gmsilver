import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useMyOrdersQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const STATUS_COLOR: Record<string, string> = {
  PENDING:   '#FFB347',
  APPROVED:  '#4CAF50',
  COMPLETED: C.silver,
  REJECTED:  C.error,
  CANCELLED: C.error,
};

export default function OrdersScreen({ navigation }: any) {
  const { data, error, isError } = useMyOrdersQuery({ page: 1, limit: 100 });
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const orders: any[] = data?.data || [];

  useEffect(() => {
    if (isError && error) { setSnackMsg(getErrorMessage(error, 'Failed.')); setSnackVisible(true); }
  }, [error, isError]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <MotionReveal delay={30} duration={420} distance={18}>
        <View style={s.header}>
          <Text style={s.headerTitle}>My Orders</Text>
          <Text style={s.headerSub}>{orders.length} orders</Text>
        </View>
      </MotionReveal>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 28, 220)} duration={250} distance={10}>
            <ScalePressable
              style={s.card}
              scaleTo={0.985}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
              <View style={s.cardTop}>
                <Text style={s.orderNum}>{item.orderNumber}</Text>
                <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] ?? C.textMuted) + '22', borderColor: STATUS_COLOR[item.status] ?? C.textMuted }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[item.status] ?? C.textMuted }]}>{item.status}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.orderTotal}>₹{Number(item.grandTotal).toLocaleString()}</Text>
                <Text style={s.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
            </ScalePressable>
          </MotionReveal>
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>◉</Text>
            <Text style={s.emptyText}>No orders yet</Text>
          </View>
        }
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  headerSub: { color: C.textSub, fontSize: 11, marginTop: 3, letterSpacing: 1, textTransform: 'uppercase' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, ...E.softShadow },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderNum: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { color: C.silver, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  orderDate: { color: C.textMuted, fontSize: 12 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 36, color: C.textMuted },
  emptyText: { color: C.textSub, fontSize: 15 },
});

