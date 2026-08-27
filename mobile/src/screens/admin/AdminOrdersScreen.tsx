import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import {
  useAdminDeleteOrderMutation,
  useAdminOrdersQuery,
  useAdminUpdateOrderStatusMutation,
} from '@/store/services/adminOrdersApi';
import { useAdminGenerateInvoiceMutation } from '@/store/services/adminInvoicesApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const;
const NEXT: Record<string, string[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export default function AdminOrdersScreen({ navigation }: any) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminOrdersQuery(
    {
      page: 1,
      limit: 100,
      status: filter === 'ALL' ? undefined : filter,
    },
    { refetchOnMountOrArgChange: true, refetchOnFocus: true },
  );
  const [updateStatus] = useAdminUpdateOrderStatusMutation();
  const [deleteOrder] = useAdminDeleteOrderMutation();
  const [generateInvoice] = useAdminGenerateInvoiceMutation();
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load orders.'));
  }, [error, isError]);

  const orders: any[] = useMemo(() => data?.data || [], [data]);

  const changeStatus = (id: string, status: string) => {
    Alert.alert('Update order', `Set status to ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateStatus({ id, status }).unwrap();
            await refetch();
            setSnack(`Order set to ${status}`);
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to update order.'));
            await refetch();
          }
        },
      },
    ]);
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete order', 'Delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrder(id).unwrap();
            setSnack('Order deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete order.'));
          }
        },
      },
    ]);
  };

  const onInvoice = async (id: string) => {
    try {
      await generateInvoice(id).unwrap();
      setSnack('Invoice generated');
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to generate invoice.'));
    }
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Orders" onBack={() => navigation.goBack()} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
      >
        {FILTERS.map((key) => (
          <ScalePressable
            key={key}
            style={[s.chip, filter === key && { backgroundColor: C.accentSoft }]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.chipText, filter === key && { color: C.ruby }]}>{key}</Text>
          </ScalePressable>
        ))}
      </ScrollView>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={s.empty}>No orders</Text>}
          renderItem={({ item }) => (
            <ScalePressable
              style={s.card}
              onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}
            >
              <View style={s.row}>
                <Text style={s.title}>#{item.orderNumber || item.id.slice(0, 8)}</Text>
                <View style={s.chip}>
                  <Text style={s.chipText}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.meta}>
                {item.user?.name || item.user?.email || 'Customer'}
              </Text>
              <View style={s.actions}>
                {(NEXT[item.status] || []).map((st) => (
                  <ScalePressable
                    key={st}
                    style={s.actionBtn}
                    onPress={() => changeStatus(item.id, st)}
                  >
                    <Text style={s.actionText}>{st}</Text>
                  </ScalePressable>
                ))}
                {!item.invoice ? (
                  <ScalePressable style={s.actionBtn} onPress={() => onInvoice(item.id)}>
                    <Text style={s.actionText}>Invoice</Text>
                  </ScalePressable>
                ) : null}
                <ScalePressable
                  style={[s.actionBtn, s.actionBtnDanger]}
                  onPress={() => onDelete(item.id)}
                >
                  <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                </ScalePressable>
              </View>
            </ScalePressable>
          )}
        />
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
