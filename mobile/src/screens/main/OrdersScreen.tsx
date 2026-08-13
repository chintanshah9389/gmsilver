import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useMyOrdersQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';

const STATUS_COLOR: Record<string, string> = {
  PENDING: C.warning,
  APPROVED: C.success,
  COMPLETED: C.silver,
  REJECTED: C.error,
  CANCELLED: C.error,
};

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'] as const;

function formatMoney(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrdersScreen({ navigation }: any) {
  const { data, error, isError } = useMyOrdersQuery({ page: 1, limit: 100 });
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const orders: any[] = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed to load orders.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  const visible = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter(o => o.status === filter)),
    [orders, filter],
  );

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.topBlock}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>My Orders</Text>
            <Text style={s.pageSub}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filtersScroll}
          contentContainerStyle={s.filters}
        >
          {FILTERS.map((key) => (
            <ScalePressable
              key={key}
              scaleTo={0.97}
              style={[s.filterChip, filter === key && s.filterChipOn]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.filterText, filter === key && s.filterTextOn]}>
                {key === 'ALL' ? 'All' : key}
              </Text>
            </ScalePressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        style={s.listFlex}
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const color = STATUS_COLOR[item.status] ?? C.textMuted;
          const items: any[] = item.items || [];
          const thumbs = items
            .map((row) => row.product?.image1Url || row.product?.imageUrl)
            .filter(Boolean)
            .slice(0, 3);
          return (
            <MotionReveal delay={Math.min(index * 28, 220)} duration={250} distance={10}>
              <ScalePressable
                style={s.card}
                scaleTo={0.985}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={s.cardTop}>
                  <View style={s.cardTitleWrap}>
                    <Text style={s.orderNum} numberOfLines={1}>
                      {item.orderNumber}
                    </Text>
                    <Text style={s.meta}>
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                      {item.createdAt ? `  ?  ${formatDate(item.createdAt)}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: color + '22', borderColor: color },
                    ]}
                  >
                    <Text style={[s.statusText, { color }]} numberOfLines={1}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {thumbs.length > 0 ? (
                  <View style={s.thumbs}>
                    {thumbs.map((uri: string, i: number) => (
                      <Image key={`${item.id}-${i}`} source={{ uri }} style={s.thumb} />
                    ))}
                    {items.length > thumbs.length ? (
                      <View style={s.moreThumb}>
                        <Text style={s.moreThumbText}>+{items.length - thumbs.length}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={s.cardBottom}>
                  <Text style={s.orderTotal}>{formatMoney(item.grandTotal)}</Text>
                  <View style={s.viewRow}>
                    <Text style={s.viewText}>View details</Text>
                    <Icon source="chevron-right" size={16} color={C.silver} />
                  </View>
                </View>
              </ScalePressable>
            </MotionReveal>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIconBox}>
              <Icon source="package-variant-closed" size={28} color={C.textMuted} />
            </View>
            <Text style={s.emptyText}>No orders yet</Text>
            <Text style={s.emptySub}>Placed orders will show up here</Text>
          </View>
        }
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  listFlex: { flex: 1 },
  topBlock: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pageTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pageSub: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.4,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  filterTextOn: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...E.softShadow,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  orderNum: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  meta: { color: C.textMuted, fontSize: 11, marginTop: 3 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    maxWidth: 110,
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  thumbs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  thumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.surface2 },
  moreThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  moreThumbText: { color: C.textSub, fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { color: C.goldDim, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { color: C.textSub, fontSize: 12, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(184,149,108,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: { color: C.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: C.textMuted, fontSize: 13 },
});
