import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useMyOrdersQuery, useCancelOrderMutation } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
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

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrdersScreen({ navigation }: any) {
  const [isFocused, setIsFocused] = useState(true);
  const { data, error, isError, refetch } = useMyOrdersQuery(
    { page: 1, limit: 100 },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      // Keep status fresh while this screen stays open (push may not fire on web).
      pollingInterval: isFocused ? 10000 : 0,
    },
  );
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [cancelOrder] = useCancelOrderMutation();
  const orders: any[] = data?.data || [];

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      void refetch();
      return () => setIsFocused(false);
    }, [refetch]),
  );

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
            <Text style={s.pageEyebrow}>Salon Order Vitrine</Text>
            <Text style={s.pageTitle}>My Orders</Text>
          </View>
          <View style={s.countPill}>
            <Text style={s.countPillText}>
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
              {key === 'PENDING' && filter !== key ? <View style={s.pendingDot} /> : null}
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
                    <View style={s.orderIdRow}>
                      <Icon source="check-decagram" size={16} color={C.gold} />
                      <Text style={s.orderNum} numberOfLines={1}>
                        {item.orderNumber ? `#${item.orderNumber}` : item.id}
                      </Text>
                    </View>
                    <Text style={s.meta}>
                      {item.createdAt ? formatDate(item.createdAt) : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.statusBadge,
                      item.status === 'PENDING'
                        ? s.statusPending
                        : { backgroundColor: color + '22', borderColor: color },
                    ]}
                  >
                    <Text
                      style={[
                        s.statusText,
                        { color: item.status === 'PENDING' ? C.goldDim : color },
                      ]}
                      numberOfLines={1}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {items[0] ? (
                  <View style={s.snippet}>
                    {items[0].product?.image1Url ? (
                      <Image source={{ uri: items[0].product.image1Url }} style={s.snippetImg} />
                    ) : (
                      <View style={s.snippetImg} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.snippetName} numberOfLines={1}>
                        {items[0].product?.name}
                      </Text>
                      <Text style={s.snippetMeta}>
                        Qty: {items[0].quantity || 1}
                        {items[0].product?.sku ? ` · ${items[0].product.sku}` : ''}
                      </Text>
                    </View>
                  </View>
                ) : thumbs.length > 0 ? (
                  <View style={s.thumbs}>
                    {thumbs.map((uri: string, i: number) => (
                      <Image key={`${item.id}-${i}`} source={{ uri }} style={s.thumb} />
                    ))}
                  </View>
                ) : null}

                {item.notes ? (
                  <View style={s.notes}>
                    <Icon source="note-text-outline" size={16} color={C.gold} />
                    <Text style={s.notesText} numberOfLines={1}>
                      NOTES: {item.notes}
                    </Text>
                  </View>
                ) : null}

                <View style={s.cardBottom}>
                  <View style={s.viewRow}>
                    <Text style={s.viewText}>View details</Text>
                    <Icon source="chevron-right" size={16} color={C.goldDim} />
                  </View>
                  {item.status === 'PENDING' ? (
                    <ScalePressable
                      style={s.cancelBtn}
                      onPress={async () => {
                        try {
                          await cancelOrder(item.id).unwrap();
                          setSnackMsg('Order cancelled.');
                          setSnackVisible(true);
                        } catch (e) {
                          setSnackMsg(getErrorMessage(e, 'Could not cancel order.'));
                          setSnackVisible(true);
                        }
                      }}
                    >
                      <Text style={s.cancelText}>Cancel order</Text>
                    </ScalePressable>
                  ) : null}
                </View>
              </ScalePressable>
            </MotionReveal>
          );
        }}
        ListFooterComponent={
          <View style={s.accountFoot}>
            <Text style={s.pageEyebrow}>Profile & Preferences</Text>
            <Text style={s.accountTitle}>My Account</Text>
            <ScalePressable
              style={s.accountCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={s.accountCta}>Open profile, invoices & settings</Text>
              <Icon source="chevron-right" size={20} color={C.goldDim} />
            </ScalePressable>
            <View style={s.concierge}>
              <Text style={s.pageEyebrow}>Haute Joaillerie Concierge</Text>
              <Text style={s.conciergeTitle}>Need assistance with your piece?</Text>
              <Text style={s.conciergeSub}>
                Our relationship managers are available 10:00 AM – 08:00 PM.
              </Text>
            </View>
          </View>
        }
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
  listFlex: { flex: 1, backgroundColor: 'transparent' },
  topBlock: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pageEyebrow: {
    color: C.goldDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  pageTitle: {
    color: C.text,
    fontSize: 28,
    fontFamily: F.serif,
    fontWeight: '500',
    marginTop: 2,
  },
  countPill: {
    backgroundColor: C.surface3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countPillText: { color: C.textSub, fontSize: 12, fontWeight: '700' },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginRight: 6,
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPending: {
    backgroundColor: '#FFE088',
    borderColor: '#FFE088',
  },
  snippet: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FAF2EE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  snippetImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: C.bg2 },
  snippetName: { color: C.text, fontSize: 15, fontFamily: F.serif, fontWeight: '600' },
  snippetMeta: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  notes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface3,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  notesText: { color: C.textSub, fontSize: 12, flex: 1 },
  cancelBtn: {
    backgroundColor: C.surface3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cancelText: { color: C.ruby, fontSize: 12, fontWeight: '700' },
  accountFoot: { paddingTop: 18 },
  accountTitle: { color: C.text, fontSize: 26, fontFamily: F.serif, marginBottom: 10 },
  accountCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...E.softShadow,
  },
  accountCta: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1 },
  concierge: {
    marginTop: 16,
    backgroundColor: C.surface3,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  conciergeTitle: { color: C.text, fontSize: 18, fontFamily: F.serif, marginTop: 6, textAlign: 'center' },
  conciergeSub: { color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 },
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipOn: { backgroundColor: C.ruby, borderColor: C.ruby },
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
  cardBottom: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
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
